import mongoose from "mongoose";

export async function connectMongo() {
  const isTest = process.env.NODE_ENV === "test";
  const uri = isTest ? process.env.MONGO_URI_TEST : process.env.MONGO_URI;
  if (!uri)
    throw new Error(`${isTest ? "MONGO_URI_TEST" : "MONGO_URI"} manquant`);
  //console.log(`🔗 Connexion à la base de données sur l'URL suivante : ${uri}`);
  await mongoose.connect(uri);
  if (!isTest) {
    console.log("Base de données connectée, au boulot !");
  }
}
