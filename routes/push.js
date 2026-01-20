import express from "express";
import PushSubscription from "../models/PushSubscription.model.js";
import webPush from "../webpush.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

/**
 * GET /push/vapidPublicKey
 * Retourne la clé publique VAPID (pas besoin d'auth)
 */
router.get("/vapidPublicKey", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

/**
 * POST /push/subscribe
 * Enregistre une subscription push pour l'utilisateur authentifié
 */
router.post("/subscribe", authenticate, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user._id;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    // Upsert: met à jour si endpoint existe, sinon crée
    await PushSubscription.updateOne(
      { endpoint },
      { endpoint, keys, userId, createdAt: new Date() },
      { upsert: true }
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error subscribing:", err);
    res.status(500).json({ error: "Subscription failed" });
  }
});

/**
 * POST /push/unsubscribe
 * Supprime une subscription push
 */
router.post("/unsubscribe", async (req, res) => {
  const endpoint = req.body?.endpoint;

  if (!endpoint) {
    return res.status(400).json({ error: "Missing subscription endpoint" });
  }

  try {
    const result = await PushSubscription.deleteOne({ endpoint });

    if (result.deletedCount === 0) {
      // Pas d'erreur si déjà supprimé - idempotent
      return res.json({ success: true, message: "Already unsubscribed" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error unsubscribing:", err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

/**
 * POST /push/welcome
 * Envoie une notification de bienvenue uniquement à l'utilisateur authentifié
 */
router.post("/welcome", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Cherche les subscriptions de CET utilisateur uniquement
    const subs = await PushSubscription.find({ userId });

    if (!subs.length) {
      return res.status(400).json({ error: "No subscription found for this user" });
    }

    const payload = JSON.stringify({
      title: "Bienvenue",
      body: "Merci d'avoir activé les notifications",
      url: "/",
    });

    let sentCount = 0;
    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub, payload);
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expirée, on la supprime
          console.warn("Subscription expired, deleting:", sub.endpoint);
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        } else {
          console.error("Failed to send to subscription:", err.message);
        }
      }
    }

    res.json({ success: true, sent: sentCount });
  } catch (err) {
    console.error("Error sending welcome notification:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

/**
 * POST /push/send
 * Envoie une notification personnalisée à un utilisateur spécifique (admin only)
 */
router.post("/send", authenticate, async (req, res) => {
  try {
    const { targetUserId, title, body, url } = req.body;

    // Vérifier si l'utilisateur est admin
    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ error: "Admin only" });
    }

    if (!targetUserId || !title) {
      return res.status(400).json({ error: "Missing targetUserId or title" });
    }

    const subs = await PushSubscription.find({ userId: targetUserId });

    if (!subs.length) {
      return res.status(404).json({ error: "No subscription found for target user" });
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
    });

    let sentCount = 0;
    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub, payload);
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        }
      }
    }

    res.json({ success: true, sent: sentCount });
  } catch (err) {
    console.error("Error sending notification:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

/**
 * POST /push/broadcast
 * Envoie une notification à tous les utilisateurs (admin only)
 */
router.post("/broadcast", authenticate, async (req, res) => {
  try {
    const { title, body, url } = req.body;

    if (!req.user.role.includes("admin")) {
      return res.status(403).json({ error: "Admin only" });
    }

    if (!title) {
      return res.status(400).json({ error: "Missing title" });
    }

    const subs = await PushSubscription.find();

    if (!subs.length) {
      return res.status(404).json({ error: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
    });

    let sentCount = 0;
    let expiredCount = 0;

    for (const sub of subs) {
      try {
        await webPush.sendNotification(sub, payload);
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          expiredCount++;
        }
      }
    }

    res.json({ success: true, sent: sentCount, expired: expiredCount });
  } catch (err) {
    console.error("Error broadcasting:", err);
    res.status(500).json({ error: "Failed to broadcast" });
  }
});

export default router;
