import Hike from "../models/Hike.model.js";
import User from "../models/User.model.js";

/**
 * Seeds hikes (publications/récits de randonnées)
 */
export async function seedHikes() {
  try {
    console.log("🥾 Seeding Hikes (publications)...");

    // Supprimer tous les hikes existants
    await Hike.deleteMany({});
    console.log("   🗑️  Hikes existants supprimés");

    // Récupérer des utilisateurs pour les auteurs
    const accompagnants = await User.find({ role: "accompagnant" }).limit(3);
    const enfants = await User.find({ role: "enfant" }).limit(6);

    if (accompagnants.length === 0 || enfants.length === 0) {
      throw new Error("Veuillez d'abord exécuter le seeder user.seeder.js");
    }

    // Créer les hikes - SEULS LES ACCOMPAGNANTS CRÉENT DES HIKES
    const hikesData = [
      {
        user: accompagnants[0]._id,
        content:
          "Magnifique sortie aujourd'hui dans le Lavaux ! Les vignobles étaient splendides sous le soleil. Tous les participants ont bien suivi, même si la chaleur était au rendez-vous. Bravo à tout le groupe pour cette première sortie de l'année ! 🌞🥾",
        imageUrl:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      },
      {
        user: accompagnants[1]._id,
        content:
          "Entraînement technique réussi ce week-end. Le groupe a bien géré le dénivelé important et les passages délicats. Excellente préparation pour le camp d'été ! Quelques points à améliorer sur la gestion de l'effort, mais dans l'ensemble très satisfait. 💪",
      },
      {
        user: accompagnants[2]._id,
        content:
          "Retour sur notre sortie de reconnaissance dans le Val de Bagnes. Conditions météo parfaites, itinéraire validé pour le camp. Merci à tous les participants pour leur engagement ! Le niveau du groupe progresse vraiment bien 👍",
      },
      {
        user: accompagnants[0]._id,
        content:
          "Petite réflexion après nos 3 entraînements : je vois vraiment l'évolution du groupe depuis le début. Les enfants sont plus à l'aise en montagne, gèrent mieux leur rythme et s'entraident naturellement. C'est exactement l'esprit que nous cherchons à développer ! Bravo à tous 🏔️❤️",
      },
      {
        user: accompagnants[1]._id,
        content:
          "Superbe camp d'été ! Les enfants ont dépassé les attentes. La cohésion du groupe s'est vraiment renforcée. Hâte de recommencer l'année prochaine ! 🏕️",
        imageUrl:
          "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
      },
    ];

    const hikes = await Hike.insertMany(hikesData);

    console.log(`   ✅ ${hikes.length} hikes créés par les accompagnants`);

    return hikes;
  } catch (error) {
    console.error("   ❌ Erreur lors du seeding des hikes:", error.message);
    throw error;
  }
}

export default seedHikes;

// Exécuter le script directement s'il est lancé en tant que fichier principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = await import("mongoose");
  const { connectMongo } = await import("../db/db.js");

  try {
    await connectMongo();
    await seedHikes();
    await mongoose.default.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
