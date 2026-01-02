import mongoose from "mongoose";

async function cleanDatabase() {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({}); // Vide le contenu sans supprimer la collection
  }
}
export { cleanDatabase };
