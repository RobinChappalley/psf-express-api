import mongoose from "mongoose";

async function cleanDatabase() {
  // Petite sécurité : si la connexion n'est pas établie, on ne fait rien
  if (!mongoose.connection.db) return;

  const collections = await mongoose.connection.db.collections();

  // On transforme le tableau de collections en un tableau de Promesses de suppression
  const deletePromises = collections.map((collection) =>
    collection.deleteMany({})
  );

  // On attend que TOUTES les suppressions soient terminées
  await Promise.all(deletePromises);
}

async function cleanDatabaseExceptUsers() {
  if (!mongoose.connection.db) return;

  const collections = await mongoose.connection.db.collections();

  const deletePromises = collections
    .filter((col) => col.collectionName !== "users")
    .map((col) => col.deleteMany({}));

  await Promise.all(deletePromises);
}

export { cleanDatabase, cleanDatabaseExceptUsers };
