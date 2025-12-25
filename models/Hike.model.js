import mongoose from "mongoose";
const { Schema } = mongoose;

const hikeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: Date,
  gpsTrack: {},
  startPoint: String,
  endPoint: String,
  distance: Number,
  elevationGain: Number,
  elevationLoss: Number,
  routeDescription: String,
});

const HikeModel = mongoose.model("Hike", hikeSchema);
export default HikeModel;
//module.exports = HikeModel;
