// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import {Paystack} from "paystack-sdk";

// =============================================================================
// INITIALIZATION
// =============================================================================
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// AUTHENTICATION TRIGGER
// =============================================================================
// In functions/src/index.ts

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userRef = db.collection("users").doc(uid);

  const newUserProfile = {
    email,
    displayName: displayName || "",
    role: "artist",
    tierId: "taste-test",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paystackCustomerId: null,
    paystackSubscriptionCode: null,
    hasCompletedOnboarding: false, // <-- ADD THIS LINE
  };

  try {
    await userRef.set(newUserProfile);
    console.log(`Successfully created user profile for UID: ${uid}`);
  } catch (error) {
    console.error(`Error creating user profile for UID: ${uid}`, error);
  }
});

// =============================================================================
// PAYSTACK PAYMENT FUNCTIONS
// =============================================================================
const paystack = new Paystack(functions.config().paystack.secret);
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack.webhook_secret;

export const initializePaystackTransaction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to subscribe.",
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    const {planCode, successUrl, cancelUrl} = data;

    try {
      const response = await paystack.transaction.initialize({
        email: userEmail,
        plan: planCode,
        callback_url: successUrl,
        metadata: {
          firebaseUID: userId,
          cancel_action: cancelUrl,
        },
      });
      return {url: response.data.authorization_url};
    } catch (error) {
      console.error("Paystack initialization failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to initialize payment.",
      );
    }
  },
);

export const handlePaystackWebhook = functions.https.onRequest(
  async (req, res) => {
    const hash = crypto.createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("Webhook signature verification failed.");
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body;
    const firebaseUID = event.data.customer.metadata?.firebaseUID;

    if (!firebaseUID) {
      res.status(400).send("Webhook Error: Missing firebaseUID in metadata");
      return;
    }

    try {
      switch (event.event) {
        case "subscription.create": {
          const planCode = event.data.plan.plan_code;
          const subCode = event.data.subscription_code;
          const tiers = await db
            .collection("tiers")
            .where("paystackPlanCode", "==", planCode)
            .limit(1)
            .get();
          if (!tiers.empty) {
            const tierId = tiers.docs[0].id;
            await db.collection("users").doc(firebaseUID).update({
              tierId: tierId,
              paystackSubscriptionCode: subCode,
            });
          }
          break;
        }
        case "subscription.disable": {
          await db.collection("users").doc(firebaseUID).update({
            tierId: "taste-test",
            paystackSubscriptionCode: null,
          });
          break;
        }
      }
    } catch (error) {
      console.error("Error updating user tier:", error);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.status(200).send();
  },
);

// =============================================================================
// DATA SYNC PIPELINE
// =============================================================================
const VIBERATE_API_KEY = functions.config().viberate.key;
const SOUNDCHARTS_APP_ID = functions.config().soundcharts.app_id;
const SOUNDCHARTS_API_TOKEN = functions.config().soundcharts.api_token;

export const syncArtistData = functions.runWith({
  timeoutSeconds: 540,
  memory: "1GB",
}).https.onRequest(async (req, res) => {
  console.log("Starting Artist Data Sync Job.");

  const artistsSnapshot = await db.collection("artists").get();
  if (artistsSnapshot.empty) {
    console.log("No artists to sync.");
    res.status(200).send("No artists to sync.");
    return;
  }

  const syncPromises: Promise<void>[] = [];

  for (const doc of artistsSnapshot.docs) {
    const artist = doc.data();
    const artistId = doc.id;
    const viberateId = artist.viberateId;
    const soundchartsId = artist.soundchartsId;

    const promise = (async () => {
      let dataSynced = false;

      // --- STRATEGY 1: TRY VIBERATE FIRST (PRIMARY) ---
      if (viberateId && VIBERATE_API_KEY) {
        try {
          console.log(`Attempting sync for artist ${artistId} with Viberate.`);
          const response = await fetch(
            `https://api.viberate.com/v2/artists/${viberateId}/analytics?apiKey=${VIBERATE_API_KEY}`,
          );
          if (!response.ok) {
            throw new Error(`Viberate API Error: Status ${response.status}`);
          }
          const data = await response.json();
          if (data.streaming?.daily) {
            const batch = db.batch();
            data.streaming.daily.forEach((day: any) => {
              const docRef = db.collection("artist_analytics")
                .doc(artistId).collection("streaming_data")
                .doc(`${day.source}_${day.date}`);
              batch.set(docRef, {
                date: new Date(day.date),
                source: day.source,
                streams: day.streams,
              });
            });
            await batch.commit();
            dataSynced = true;
            console.log(`Success: Synced artist ${artistId} from Viberate.`);
          }
        } catch (error) {
          console.error(`Failed: Sync for ${artistId} from Viberate.`, error);
        }
      }

      // --- STRATEGY 2: FALLBACK TO SOUNDCHARTS (SECONDARY) ---
      if (!dataSynced && soundchartsId && SOUNDCHARTS_APP_ID) {
        try {
          console.log(`Attempting sync for artist ${artistId} with Soundcharts.`);
          const url = `https://customer.api.soundcharts.com/api/v2/artist/${soundchartsId}/streaming/spotify/listening`;
          const response = await fetch(url, {
            headers: {
              "x-app-id": SOUNDCHARTS_APP_ID,
              "x-api-key": SOUNDCHARTS_API_TOKEN,
            },
          });
          if (!response.ok) {
            throw new Error(`Soundcharts API Error: Status ${response.status}`);
          }
          const data = await response.json();
          if (data.items?.length > 0) {
            const batch = db.batch();
            data.items.forEach((day: any) => {
              const docId = `spotify_${day.date}`;
              const docRef = db.collection("artist_analytics")
                .doc(artistId).collection("streaming_data").doc(docId);
              batch.set(docRef, {
                date: new Date(day.date),
                source: "spotify",
                streams: day.value,
              });
            });
            await batch.commit();
            dataSynced = true;
            console.log(`Success: Synced artist ${artistId} from Soundcharts.`);
          }
        } catch (error) {
          console.error(`Failed: Sync for ${artistId} from Soundcharts.`, error);
        }
      }

      // --- FINAL STEP: UPDATE SYNC TIMESTAMP ---
      if (dataSynced) {
        await db.collection("artists").doc(artistId).update({
          lastSynced: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.warn(`Could not sync data for artist ${artistId}.`);
      }
    })();
    syncPromises.push(promise);
  }

  await Promise.all(syncPromises);

  console.log("Artist Data Sync Job Finished.");
  res.status(200).send("Sync completed.");
});
// Add this to the bottom of functions/src/index.ts

import {GoogleGenerativeAI} from "@google/generative-ai";

const GEMINI_API_KEY = functions.config().google.key;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-pro"});

export const getAiResponse = functions.https.onCall(async (data, context) => {
  // 1. AUTHENTICATION & INPUT VALIDATION
  // Ensure the user is logged in and sent the required data.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to ask a question.",
    );
  }
  const userId = context.auth.uid;
  const {artistId, prompt} = data;
  if (!artistId || !prompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request must include 'artistId' and 'prompt'.",
    );
  }

  // 2. AUTHORIZATION & RATE LIMITING
  // Check if the user has permission to access this artist's data
  // and if they are within their subscription's query limits.
  const userDocRef = db.collection("users").doc(userId);
  const permissionDocRef = userDocRef.collection("tracked_artists").doc(artistId);

  const [userDoc, permissionDoc] = await Promise.all([
    userDocRef.get(),
    permissionDocRef.get(),
  ]);

  if (!permissionDoc.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to access this artist's data.",
    );
  }

  const userData = userDoc.data();
  if (!userData) {
    throw new functions.https.HttpsError("not-found", "User profile not found.");
  }

  // (Simplified rate-limiting for MVP - a real app would use a counter)
  const tierDoc = await db.collection("tiers").doc(userData.tierId).get();
  const tierData = tierDoc.data();
  if (!tierData) {
    throw new functions.https.HttpsError(
      "failed-precondition", "Subscription tier not found.",
    );
  }
  // Add actual query count check logic here based on tierData.queryLimit

  // 3. DATA FETCHING FROM FIRESTORE
  // Aggregate the last 30 days of analytics data for the artist.
  const streamingDataSnap = await db.collection("artist_analytics")
    .doc(artistId).collection("streaming_data")
    .orderBy("date", "desc").limit(30).get();

  const artistAnalytics = {
    streaming_data: streamingDataSnap.docs.map((doc) => doc.data()),
  };
  const stringifiedData = JSON.stringify(artistAnalytics, null, 2);

  // 4. PROMPT ENGINEERING
  // Construct a detailed prompt for the AI, giving it a role, the data,
  // and the user's question.
  const masterPrompt = `
    You are Syrup AI, an expert music industry analyst. Your task is to provide
    clear, concise, and actionable insights to an artist based on their data.

    Here is the artist's streaming data for the last 30 days:
    \`\`\`json
    ${stringifiedData}
    \`\`\`

    Based on this data, answer the following question:
    USER QUESTION: "${prompt}"

    YOUR ANALYSIS:
  `;

  // 5. GEMINI API CALL
  // Send the prompt to the Gemini API and get the response.
  let answer = "";
  try {
    const result = await model.generateContent(masterPrompt);
    const response = await result.response;
    answer = response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError("internal", "Failed to get AI response.");
  }

  // 6. CONVERSATION LOGGING
  // Save the user's question and the AI's answer to Firestore for chat history.
  // (We will implement the full conversation logic later)

  // 7. RETURN RESPONSE
  // Send the final answer back to the user.
  return {success: true, answer};
});
// Add this to the bottom of functions/src/index.ts

export const createSubscriptionPortalLink = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in.",
      );
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    const subscriptionCode = userDoc.data()?.paystackSubscriptionCode;

    if (!subscriptionCode) {
      throw new functions.https.HttpsError(
        "not-found",
        "Paystack subscription not found for this user.",
      );
    }

    try {
      // This is a hypothetical SDK method. You would need to check
      // the Paystack API docs for the exact method to create a management link.
      // For now, we assume a method exists like this:
      // const response = await paystack.subscription.manageLink({ code: subscriptionCode });
      // return { url: response.data.link };
      
      // Since the SDK may not have a direct method, here's the direct API link structure:
      const managementLink = `https://dashboard.paystack.com/subscriptions/${subscriptionCode}/manage`;
      return { url: managementLink };

    } catch (error) {
      console.error("Failed to create Paystack portal link:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not generate subscription management link.",
      );
    }
  },
);
// Add this to the bottom of functions/src/index.ts

export const searchArtists = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "You must be logged in to search."
    );
  }
  const { query } = data;
  if (!query) {
    throw new functions.https.HttpsError(
      "invalid-argument", "A search query must be provided."
    );
  }

  try {
    // We will use the Soundcharts search endpoint
    const url = `https://customer.api.soundcharts.com/api/v2/search/artist?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "x-app-id": SOUNDCHARTS_APP_ID,
        "x-api-key": SOUNDCHARTS_API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Soundcharts API search failed with status ${response.status}`);
    }
    const results = await response.json();
    
    // Return the list of artists found
    return { artists: results.items }; 
  } catch (error) {
    console.error("Error searching artists on Soundcharts:", error);
    throw new functions.https.HttpsError("internal", "Failed to search for artists.");
  }
});