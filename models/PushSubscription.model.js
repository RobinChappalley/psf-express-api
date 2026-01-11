// models/PushSubscription.js
import mongoose from "mongoose";

const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String,
  },
});

export default mongoose.model("PushSubscription", PushSubscriptionSchema);
