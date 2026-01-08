import Item from "../models/Item.model.js";

/**
 * Seeds items (matériel de camp)
 */
export async function seedItems() {
  try {
    console.log("🎒 Seeding Items (matériel)...");

    // Supprimer tous les items existants
    await Item.deleteMany({});
    console.log("   🗑️  Items existants supprimés");

    // Créer les items
    const itemsData = [
      {
        slug: "sac-a-dos-60l",
        name: "Sac à dos 60L",
        description: "Sac à dos de randonnée grande capacité",
      },
      {
        slug: "sac-de-couchage",
        name: "Sac de couchage",
        description: "Sac de couchage 3 saisons (-5°C confort)",
      },
      {
        slug: "matelas-gonflable",
        name: "Matelas gonflable",
        description: "Matelas isolant auto-gonflant",
      },
      {
        slug: "tente-2-places",
        name: "Tente 2 places",
        description: "Tente légère 2 personnes 3 saisons",
      },
      {
        slug: "rechaud-gaz",
        name: "Réchaud à gaz",
        description: "Réchaud portable avec cartouche",
      },
      {
        slug: "popote",
        name: "Popote",
        description: "Set de cuisine camping (casserole, poêle, couverts)",
      },
      {
        slug: "lampe-frontale",
        name: "Lampe frontale",
        description: "Lampe frontale LED rechargeable",
      },
      {
        slug: "gourde-1l",
        name: "Gourde 1L",
        description: "Gourde isotherme en inox",
      },
      {
        slug: "batons-randonnee",
        name: "Bâtons de randonnée",
        description: "Paire de bâtons télescopiques",
      },
      {
        slug: "carte-topographique",
        name: "Carte topographique",
        description: "Carte nationale suisse 1:25000",
      },
      {
        slug: "boussole",
        name: "Boussole",
        description: "Boussole de navigation",
      },
      {
        slug: "couteau-suisse",
        name: "Couteau suisse",
        description: "Couteau multifonction Victorinox",
      },
      {
        slug: "trousse-premiers-secours",
        name: "Trousse de premiers secours",
        description: "Kit de premiers secours complet",
      },
      {
        slug: "sifflet",
        name: "Sifflet",
        description: "Sifflet de secours",
      },
      {
        slug: "couverture-survie",
        name: "Couverture de survie",
        description: "Couverture thermique d'urgence",
      },
      {
        slug: "corde-30m",
        name: "Corde 30m",
        description: "Corde d'alpinisme dynamique 30m",
      },
      {
        slug: "mousquetons",
        name: "Mousquetons",
        description: "Lot de 5 mousquetons à vis",
      },
      {
        slug: "baudrier",
        name: "Baudrier",
        description: "Baudrier d'escalade réglable",
      },
      {
        slug: "casque",
        name: "Casque",
        description: "Casque d'alpinisme",
      },
      {
        slug: "crampons",
        name: "Crampons",
        description: "Crampons à 10 pointes",
      },
    ];

    const items = await Item.insertMany(itemsData);

    console.log(`   ✅ ${items.length} items créés`);

    return items;
  } catch (error) {
    console.error("   ❌ Erreur lors du seeding des items:", error.message);
    throw error;
  }
}

export default seedItems;

// Exécuter le script directement s'il est lancé en tant que fichier principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = await import("mongoose");
  const { connectMongo } = await import("../db/db.js");

  try {
    await connectMongo();
    await seedItems();
    await mongoose.default.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
