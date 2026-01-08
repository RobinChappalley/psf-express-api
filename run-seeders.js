import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectMongo } from "./db/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedersDir = path.join(__dirname, "seeders");

/**
 * Lance tous les seeders du dossier seeders/
 */
async function runAllSeeders() {
  let seedersRun = 0;
  let seedersSuccess = 0;
  let seedersError = 0;

  try {
    // Connexion à la base de données
    await connectMongo();
    console.log("✅ Connecté à la base de données\n");

    // Lire tous les fichiers du dossier seeders
    const files = fs
      .readdirSync(seedersDir)
      .filter((file) => file.endsWith(".seeder.js"))
      .sort();

    if (files.length === 0) {
      console.log("⚠️  Aucun seeder trouvé dans le dossier seeders/");
      return;
    }

    console.log(`🌱 Exécution de ${files.length} seeder(s):\n`);

    // Exécuter chaque seeder
    for (const file of files) {
      const seederPath = path.join(seedersDir, file);
      const seederName = file.replace(".seeder.js", "");

      try {
        seedersRun++;
        const module = await import(`file://${seederPath}`);
        const seederFunction = module.default;

        if (typeof seederFunction !== "function") {
          throw new Error(
            `${file} n'exporte pas une fonction par défaut (default export)`
          );
        }

        // Exécuter le seeder
        await seederFunction();
        seedersSuccess++;
      } catch (error) {
        console.error(`❌ ${seederName}:`, error.message);
        seedersError++;
      }
    }

    // Résumé
    console.log("\n" + "=".repeat(50));
    console.log(
      `📊 Résumé: ${seedersSuccess}/${seedersRun} seeder(s) réussi(s)`
    );
    if (seedersError > 0) {
      console.log(`⚠️  ${seedersError} erreur(s)`);
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Erreur fatale:", error.message);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    console.log("✅ Déconnecté de la base de données\n");

    // Quitter avec le code approprié
    if (seedersError > 0) {
      process.exit(1);
    }
  }
}

// Exécuter si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSeeders();
}

export default runAllSeeders;
