import mongoose from "mongoose";
const { Schema } = mongoose;

const itemSchema = new Schema({
  slug: String,
  name: String,
  description: String,
});
