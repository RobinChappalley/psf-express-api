import mongoose from "mongoose";
const { Schema } = mongoose;

const hikeSchema = new Schema({
  userId: Schema.Types.ObjectId,
  gpsTrack: {},
  date: Date,
  startPoint: String,
  endPoint: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  routeDescription: String,
});
