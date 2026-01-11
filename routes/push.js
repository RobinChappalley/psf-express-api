import express from "express";
import PushSubscription from "../models/PushSubscription.model.js";
import webPush from "../webpush.js";

const router = express.Router();

// Route test pour envoyer une notification push
router.post("/welcome", async (req, res) => {
  try {
    const subs = await PushSubscription.find();

    if (!subs.length) {
      return res.status(400).json({ error: "Zero subscription saved" });
    }

    const payload = JSON.stringify({
      title: "Bienvenue",
      body: "Merci d'avoir accepté les notifications",
      url: "/",
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expirée, on la supprime
          console.warn("Subscription expired, suppression:", sub.endpoint);
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        } else {
          // Toute autre erreur : on la remonte
          throw err;
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error notification :", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get("/vapidPublicKey", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post("/subscribe", async (req, res) => {
  try {
    const sub = req.body;

    await PushSubscription.updateOne({ endpoint: sub.endpoint }, sub, {
      upsert: true,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Subscription failed" });
  }
});

router.post("/unsubscribe", async (req, res) => {
  const endpoint = req.body?.endpoint;

  if (!endpoint) {
    console.warn("Missing endpoint in request body:", req.body);
    return res.status(400).json({ error: "Missing subscription endpoint" });
  }

  try {
    const result = await PushSubscription.deleteOne({ endpoint });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error unsubscribing:", err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

export default router;
