import mongoose from "mongoose";
const { Schema } = mongoose;

const hikeSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimise la recherche par auteur
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 2000,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // Gère createdAt et updatedAt automatiquement
  }
);

const HikeModel = mongoose.model("Hike", hikeSchema);
export default HikeModel;
