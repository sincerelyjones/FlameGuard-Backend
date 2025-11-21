// server.js
import express from "express";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const app = express();
app.use(bodyParser.json());

// Make sure GOOGLE_CREDENTIALS exists
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error("❌ GOOGLE_CREDENTIALS environment variable is missing!");
  process.exit(1);
}

// Parse service account JSON
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  console.error("❌ Failed to parse GOOGLE_CREDENTIALS:", err);
  process.exit(1);
}

// Replace escaped newlines with real newlines
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
  res.send("✅ FCM Server is running!");
});

app.post("/send-notification", async (req, res) => {
  const { fcmToken, title, body } = req.body;

  if (!fcmToken || !title || !body) {
    return res
      .status(400)
      .json({ success: false, error: "Missing fcmToken, title, or body" });
  }

  const message = {
    token: fcmToken,
    notification: { title, body },
    android: {
      priority: "high",
      notification: {
        channelId: "default",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
