// server.ts
import express from "express";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync("./service-account.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post("/send-notification", async (req, res) => {
  const { fcmToken, title, body } = req.body;

  if (!fcmToken || !title || !body) {
    return res.status(400).json({ success: false, error: "Missing fcmToken, title or body" });
  }

  const message = {
    token: fcmToken,
    notification: { title, body },
    android: {
      priority: "high",
      notification: {
        channelId: "default", // Make sure app creates this channel
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

app.get("/", (req, res) => {
  res.send("FCM Server running ✅");
});

app.listen(3000, () => console.log("Server running on port 3000"));
