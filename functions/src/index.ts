// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { Paystack } from "paystack-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// =============================================================================
// INITIALIZATION
// This section sets up the necessary connections to Firebase and other services.
// =============================================================================
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// AUTHENTICATION TRIGGER
// This function runs automatically whenever a new user signs up.
// =============================================================================
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
    hasCompletedOnboarding: false,
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
// These functions handle all the logic for subscriptions.
// =============================================================================
const paystack = new Paystack(functions.config().paystack.secret);
const PAYSTACK_WEBHOOK_SECRET = functions.config().paystack.webhook_secret;

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
      // **FIX**: The Paystack SDK requires 'amount' to be a string.
      // The plan's amount will override this, so we can safely set it to "0".
      const response = await paystack.transaction.initialize({
        email: userEmail,
        plan: planCode,
        amount: "0", // This now satisfies the type requirement.
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

// This function is correct and doesn't need changes.
export const handlePaystackWebhook = functions.https.onRequest(
    async (req, res) => {
        const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
                       .update(JSON.stringify(req.body))
                       .digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            res.status(401).send('Invalid signature');
            return;
        }
        // ... rest of function logic
    }
);

// This function is correct and doesn't need changes.
export const createSubscriptionPortalLink = functions.https.onCall(
    async (data, context) => {
        // ... function logic
    }
);


// =============================================================================
// DATA SYNC & SEARCH FUNCTIONS
// =============================================================================
const SOUNDCHARTS_APP_ID = functions.config().soundcharts.app_id;
const SOUNDCHARTS_API_TOKEN = functions.config().soundcharts.api_token;

// This function is correct and doesn't need changes.
export const syncArtistData = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB",
  })
  .https.onRequest(async (req, res) => {
    // ... function logic
  });

// This function is correct and doesn't need changes.
export const searchArtists = functions.https.onCall(async (data, context) => {
    // ... function logic
});


// =============================================================================
// CORE AI ENGINE
// =============================================================================
const GEMINI_API_KEY = functions.config().google.key;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const getAiResponse = functions.https.onCall(async (data, context) => {
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

  // **FIX**: The 'userDoc' variable was declared but never used, so it has been removed
  // to clean up the code and resolve the warning.
  // We can add rate limiting logic here later without needing the full user document yet.

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

  return { success: true, answer };
});