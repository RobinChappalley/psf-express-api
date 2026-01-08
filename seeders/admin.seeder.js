import mongoose from "mongoose";
import User from "../models/User.model.js";
import { connectMongo } from "../db/db.js";

const adminEmail = process.env.ADMIN_MAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

/**
 * Seeds the main administrator account
 */
export async function seedAdmin() {
  try {
    console.log("👤 Seeding Admin...");

    // Vérifier que les variables d'environnement sont définies
    if (!adminEmail || !adminPassword) {
      throw new Error(
        "Les variables d'environnement ADMIN_MAIL et ADMIN_PASSWORD doivent être définies"
      );
    }

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(
        `   ⚠️  Un utilisateur admin existe déjà: ${existingAdmin.email}`
      );
      return existingAdmin;
    }

    // Créer l'utilisateur admin
    const adminData = {
      firstname: "Admin",
      lastname: "PSF",
      email: adminEmail,
      password: adminPassword,
      role: ["admin"],
    };

    const admin = await User.create(adminData);

    console.log(`   ✅ Admin créé: ${admin.firstname} ${admin.lastname}`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   ⚠️  Veuillez changer le mot de passe après la première connexion!`);

    return admin;
  } catch (error) {
    console.error("   ❌ Erreur lors de la création de l'admin:", error.message);
    throw error;
  }
}

export default seedAdmin;

// Exécuter le script directement s'il est lancé en tant que fichier principal
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await connectMongo();
      await seedAdmin();
      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
}
