// models/PushSubscription.model.js
import mongoose from "mongoose";

const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String,
  },
  // Association avec l'utilisateur (optionnel pour rétrocompatibilité)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PushSubscription", PushSubscriptionSchema);
