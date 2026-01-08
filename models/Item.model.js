import mongoose from "mongoose";
const { Schema } = mongoose;

const itemSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: String,
});

const ItemModel = mongoose.model("Item", itemSchema);
//module.exports = ItemModel;
export default ItemModel;
