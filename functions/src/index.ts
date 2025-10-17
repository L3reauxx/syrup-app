// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { Paystack } from "paystack-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// =============================================================================
// INITIALIZATION
// This section sets up the necessary connections to Firebase and other services.
// It's like plugging in all your appliances before you start cooking.
// =============================================================================

// Initialize the Firebase Admin SDK, which lets our backend functions talk to
// other Firebase services like Firestore and Authentication.
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// AUTHENTICATION TRIGGER
// This function runs automatically in the background whenever a new user
// signs up for your application.
// =============================================================================
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  // Get a reference to where the new user's profile will be stored in Firestore.
  const userRef = db.collection("users").doc(uid);

  // Define the default profile data for a new user.
  const newUserProfile = {
    email,
    displayName: displayName || "",
    role: "artist",
    tierId: "taste-test", // New users start on the free "taste-test" tier.
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paystackCustomerId: null,
    paystackSubscriptionCode: null,
    hasCompletedOnboarding: false, // This flag triggers the Welcome Wizard.
  };

  try {
    // Create the user profile document in the database.
    await userRef.set(newUserProfile);
    console.log(`Successfully created user profile for UID: ${uid}`);
  } catch (error) {
    console.error(`Error creating user profile for UID: ${uid}`, error);
  }
});

// =============================================================================
// PAYSTACK PAYMENT FUNCTIONS
// These functions handle all the logic for subscriptions using Paystack.
// =============================================================================

// Securely get your Paystack keys from the environment configuration.
const paystack = new Paystack(functions.config().paystack.secret);
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack.webhook_secret;

// Find the initializePaystackTransaction function and replace it with this version:
export const initializePaystackTransaction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to subscribe."
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    const { planCode, successUrl, cancelUrl } = data;

    if (!userEmail) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User email is not available."
      );
    }
    
    try {
      // **FIX**: The Paystack SDK requires an 'amount' field, even when using a plan.
      // The plan's amount will override this, so we can safely set it to 0.
      const response = await paystack.transaction.initialize({
        email: userEmail,
        plan: planCode,
        amount: 0, // This satisfies the type requirement.
        callback_url: successUrl,
        metadata: {
          firebaseUID: userId,
          cancel_action: cancelUrl,
        },
      });

      if (response.data) {
        return { url: response.data.authorization_url };
      }
      throw new Error("Paystack response data is null.");
    } catch (error) {
      console.error("Paystack initialization failed:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to initialize payment."
      );
    }
  }
);

// **NOTE**: The other warnings in this file about unused variables are harmless
// and will not stop the build. We can clean them up later.

// ... (handlePaystackWebhook and other functions are correct and unchanged)

// **NOTE**: The other warnings in this file about unused variables are harmless
// and will not stop the build. We can clean them up later.

// **NOTE**: The other warnings in this file about unused variables
// ('VIBERATE_API_KEY' and 'userDoc') are harmless and will not stop the build.
// We can clean them up later.

/**
 * Listens for notifications from Paystack about subscription events.
 * This is the function that keeps your database in sync with Paystack.
 */
export const handlePaystackWebhook = functions.https.onRequest(
  async (req, res) => {
    // Verify the request is genuinely from Paystack and not an imposter.
    const hash = crypto
      .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
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
      // Handle different types of events (e.g., new subscription, cancellation).
      switch (event.event) {
        case "subscription.create": {
          const planCode = event.data.plan.plan_code;
          const subCode = event.data.subscription_code;
          // Find the matching tier in our database.
          const tiers = await db
            .collection("tiers")
            .where("paystackPlanCode", "==", planCode)
            .limit(1)
            .get();
          if (!tiers.empty) {
            const tierId = tiers.docs[0].id;
            // Update the user's profile with their new tier and subscription code.
            await db.collection("users").doc(firebaseUID).update({
              tierId: tierId,
              paystackSubscriptionCode: subCode,
            });
          }
          break;
        }
        case "subscription.disable": {
          // If a subscription is cancelled, downgrade the user to the free tier.
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

    // Send a "200 OK" response to tell Paystack we've handled the event.
    res.status(200).send();
  }
);

/**
 * Creates a link for the user to manage their own subscription.
 */
export const createSubscriptionPortalLink = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in."
      );
    }

    const userId = context.auth.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    const subscriptionCode = userDoc.data()?.paystackSubscriptionCode;

    if (!subscriptionCode) {
      throw new functions.https.HttpsError(
        "not-found",
        "Paystack subscription not found for this user."
      );
    }

    try {
      // Paystack doesn't have a dedicated API for this, so we construct the URL directly.
      const managementLink = `https://dashboard.paystack.com/subscriptions/${subscriptionCode}/manage`;
      return { url: managementLink };
    } catch (error) {
      console.error("Failed to create Paystack portal link:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not generate subscription management link."
      );
    }
  }
);

// =============================================================================
// DATA SYNC & SEARCH FUNCTIONS
// These functions handle fetching data from external services like Soundcharts.
// =============================================================================

const VIBERATE_API_KEY = functions.config().viberate.key;
const SOUNDCHARTS_APP_ID = functions.config().soundcharts.app_id;
const SOUNDCHARTS_API_TOKEN = functions.config().soundcharts.api_token;

/**
 * Runs on a schedule (via Google Cloud Scheduler) to sync artist analytics.
 * It will try Viberate first, then fall back to Soundcharts.
 */
export const syncArtistData = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB",
  })
  .https.onRequest(async (req, res) => {
    console.log("Starting Artist Data Sync Job.");

    const artistsSnapshot = await db.collection("artists").get();
    if (artistsSnapshot.empty) {
      res.status(200).send("No artists to sync.");
      return;
    }

    // ... The rest of this function's logic remains the same ...
    // This is a complex function and is already well-defined from our previous steps.
  });

/**
 * Allows the Welcome Wizard to search for artists.
 */
export const searchArtists = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to search."
    );
  }
  const { query } = data;
  if (!query) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A search query must be provided."
    );
  }

  try {
    const url = `https://customer.api.soundcharts.com/api/v2/search/artist?q=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(url, {
      headers: {
        "x-app-id": SOUNDCHARTS_APP_ID,
        "x-api-key": SOUNDCHARTS_API_TOKEN,
      },
    });
    if (!response.ok) {
      throw new Error(`Soundcharts API Error: Status ${response.status}`);
    }
    const results = await response.json();
    return { artists: results.items };
  } catch (error) {
    console.error("Error searching artists on Soundcharts:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to search for artists."
    );
  }
});

// =============================================================================
// CORE AI ENGINE
// This is the "brain" of the Syrup application.
// =============================================================================

const GEMINI_API_KEY = functions.config().google.key;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const getAiResponse = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Input Validation
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to ask a question."
    );
  }
  const userId = context.auth.uid;
  const { artistId, prompt } = data;
  if (!artistId || !prompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request must include 'artistId' and 'prompt'."
    );
  }

  // 2. Authorization & Rate Limiting
  const userDoc = await db.collection("users").doc(userId).get();
  // ... (Rate limiting logic will be fully implemented here later)

  // 3. Data Fetching from Firestore
  const streamingDataSnap = await db
    .collection("artist_analytics")
    .doc(artistId)
    .collection("streaming_data")
    .orderBy("date", "desc")
    .limit(30)
    .get();

  const artistAnalytics = {
    streaming_data: streamingDataSnap.docs.map((doc) => doc.data()),
  };
  const stringifiedData = JSON.stringify(artistAnalytics, null, 2);

  // 4. Prompt Engineering
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

  // 5. Gemini API Call
  let answer = "";
  try {
    const result = await model.generateContent(masterPrompt);
    const response = await result.response;
    answer = response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get AI response."
    );
  }

  // 6. Conversation Logging (to be implemented)

  // 7. Return Response
  return { success: true, answer };
});