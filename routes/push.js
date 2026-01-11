import express from "express";
import PushSubscription from "../models/PushSubscription.model.js";
import webPush from "../webpush.js";

const router = express.Router();

// Route test pour envoyer une notification push
router.post("/test", async (req, res) => {
  try {
    const subs = await PushSubscription.find();

    if (!subs.length) {
      return res.status(400).json({ error: "Aucune subscription enregistrée" });
    }

    const payload = JSON.stringify({
      title: "Test notification",
      body: "Notification test envoyée depuis le backend",
      url: "/",
    });

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expirée, on la supprime
          console.warn("Subscription expirée, suppression:", sub.endpoint);
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        } else {
          // Toute autre erreur : on la remonte
          throw err;
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erreur notification test:", err);
    res.status(500).json({ error: "Échec de la notification" });
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

export default router;
