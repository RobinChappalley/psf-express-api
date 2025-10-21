import mongoose from "mongoose";

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI manquant");
  await mongoose.connect(uri);
  console.log("Base de données connectée, au boulot !");
}
