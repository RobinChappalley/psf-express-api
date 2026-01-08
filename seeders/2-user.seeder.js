import User from "../models/User.model.js";

/**
 * Seeds users (accompagnants, parents, enfants)
 */
export async function seedUsers() {
  try {
    console.log("👥 Seeding Users...");

    // Supprimer tous les utilisateurs NON-ADMIN existants
    await User.deleteMany({ role: { $ne: "admin" } });
    console.log("   🗑️  Utilisateurs existants supprimés (admin préservé)");

    // Créer les accompagnants
    const accompagnantsData = [
      {
        role: ["accompagnant"],
        firstname: "Sophie",
        lastname: "Martin",
        email: "sophie.martin@example.com",
        password: "password123",
        phoneNumber: "+41 79 123 45 67",
        address: {
          street: "Rue de la Gare 12",
          city: "Lausanne",
          postalCode: 1003,
          country: "Suisse",
        },
      },
      {
        role: ["accompagnant"],
        firstname: "Thomas",
        lastname: "Dubois",
        email: "thomas.dubois@example.com",
        password: "password123",
        phoneNumber: "+41 78 234 56 78",
        address: {
          street: "Avenue du Léman 45",
          city: "Genève",
          postalCode: 1201,
          country: "Suisse",
        },
      },
      {
        role: ["accompagnant"],
        firstname: "Marie",
        lastname: "Bernard",
        email: "marie.bernard@example.com",
        password: "password123",
        phoneNumber: "+41 76 345 67 89",
        address: {
          street: "Chemin des Alpes 23",
          city: "Montreux",
          postalCode: 1820,
          country: "Suisse",
        },
      },
    ];

    const accompagnants = await User.insertMany(accompagnantsData);
    console.log(`   ✅ ${accompagnants.length} accompagnants créés`);

    // Créer les parents
    const parentsData = [
      {
        role: ["parent"],
        firstname: "Jean",
        lastname: "Dupont",
        email: "jean.dupont@example.com",
        password: "password123",
        phoneNumber: "+41 79 456 78 90",
        address: {
          street: "Route de Berne 67",
          city: "Lausanne",
          postalCode: 1010,
          country: "Suisse",
        },
      },
      {
        role: ["parent"],
        firstname: "Claire",
        lastname: "Leroy",
        email: "claire.leroy@example.com",
        password: "password123",
        phoneNumber: "+41 78 567 89 01",
        address: {
          street: "Rue du Mont-Blanc 34",
          city: "Genève",
          postalCode: 1205,
          country: "Suisse",
        },
      },
      {
        role: ["parent"],
        firstname: "Pierre",
        lastname: "Moreau",
        email: "pierre.moreau@example.com",
        password: "password123",
        phoneNumber: "+41 76 678 90 12",
        address: {
          street: "Avenue de la Gare 89",
          city: "Sion",
          postalCode: 1950,
          country: "Suisse",
        },
      },
      {
        role: ["parent"],
        firstname: "Isabelle",
        lastname: "Favre",
        email: "isabelle.favre@example.com",
        password: "password123",
        phoneNumber: "+41 79 789 01 23",
        address: {
          street: "Chemin des Vignes 12",
          city: "Vevey",
          postalCode: 1800,
          country: "Suisse",
        },
      },
    ];

    const parents = await User.insertMany(parentsData);
    console.log(`   ✅ ${parents.length} parents créés`);

    // Créer les enfants (liés aux parents)
    const enfantsData = [
      {
        role: ["enfant"],
        firstname: "Lucas",
        lastname: "Dupont",
        parent: parents[0]._id,
        phoneNumber: "+41 76 111 22 33",
        participationInfo: {
          birthDate: new Date("2010-05-15"),
          tshirtInfo: {
            size: "m",
            gender: "m",
          },
          allergies: ["Arachides"],
          medication: [],
          insuranceNumber: "756.1234.5678.90",
          insuranceName: "Groupe Mutuel",
          idExpireDate: new Date("2027-12-31"),
          publicTransportPass: "demi-tarif",
          isCASMember: true,
          isHelicopterInsured: true,
          hasPhotoConsent: true,
          hasPaid: true,
        },
      },
      {
        role: ["enfant"],
        firstname: "Emma",
        lastname: "Dupont",
        parent: parents[0]._id,
        phoneNumber: "+41 76 222 33 44",
        participationInfo: {
          birthDate: new Date("2012-08-22"),
          tshirtInfo: {
            size: "s",
            gender: "f",
          },
          allergies: [],
          medication: ["Ventoline (asthme)"],
          insuranceNumber: "756.2345.6789.01",
          insuranceName: "Groupe Mutuel",
          idExpireDate: new Date("2027-12-31"),
          publicTransportPass: "AG",
          isCASMember: true,
          isHelicopterInsured: true,
          hasPhotoConsent: true,
          hasPaid: true,
        },
      },
      {
        role: ["enfant"],
        firstname: "Hugo",
        lastname: "Leroy",
        parent: parents[1]._id,
        participationInfo: {
          birthDate: new Date("2011-03-10"),
          tshirtInfo: {
            size: "m",
            gender: "m",
          },
          allergies: [],
          medication: [],
          insuranceNumber: "756.3456.7890.12",
          insuranceName: "Assura",
          idExpireDate: new Date("2027-06-30"),
          publicTransportPass: "demi-tarif",
          isCASMember: false,
          isHelicopterInsured: true,
          hasPhotoConsent: true,
          hasPaid: true,
        },
      },
      {
        role: ["enfant"],
        firstname: "Léa",
        lastname: "Moreau",
        parent: parents[2]._id,
        participationInfo: {
          birthDate: new Date("2013-11-28"),
          tshirtInfo: {
            size: "s",
            gender: "f",
          },
          allergies: ["Lactose"],
          medication: [],
          insuranceNumber: "756.4567.8901.23",
          insuranceName: "CSS",
          idExpireDate: new Date("2028-01-15"),
          publicTransportPass: "AG",
          isCASMember: true,
          isHelicopterInsured: false,
          hasPhotoConsent: true,
          hasPaid: false,
        },
      },
      {
        role: ["enfant"],
        firstname: "Noah",
        lastname: "Favre",
        parent: parents[3]._id,
        participationInfo: {
          birthDate: new Date("2010-07-05"),
          tshirtInfo: {
            size: "l",
            gender: "m",
          },
          allergies: [],
          medication: [],
          insuranceNumber: "756.5678.9012.34",
          insuranceName: "Helsana",
          idExpireDate: new Date("2027-09-20"),
          publicTransportPass: "demi-tarif",
          isCASMember: true,
          isHelicopterInsured: true,
          hasPhotoConsent: true,
          hasPaid: true,
        },
      },
      {
        role: ["enfant"],
        firstname: "Chloé",
        lastname: "Favre",
        parent: parents[3]._id,
        participationInfo: {
          birthDate: new Date("2014-02-18"),
          tshirtInfo: {
            size: "xs",
            gender: "f",
          },
          allergies: [],
          medication: [],
          insuranceNumber: "756.6789.0123.45",
          insuranceName: "Helsana",
          idExpireDate: new Date("2029-03-12"),
          publicTransportPass: "AG",
          isCASMember: false,
          isHelicopterInsured: true,
          hasPhotoConsent: false,
          hasPaid: true,
        },
      },
    ];

    const enfants = await User.insertMany(enfantsData);
    console.log(`   ✅ ${enfants.length} enfants créés`);

    // Mettre à jour les parents avec leurs enfants
    await User.findByIdAndUpdate(parents[0]._id, {
      children: [enfants[0]._id, enfants[1]._id],
    });
    await User.findByIdAndUpdate(parents[1]._id, { children: [enfants[2]._id] });
    await User.findByIdAndUpdate(parents[2]._id, { children: [enfants[3]._id] });
    await User.findByIdAndUpdate(parents[3]._id, {
      children: [enfants[4]._id, enfants[5]._id],
    });

    console.log("   ✅ Relations parent-enfant établies");

    return { accompagnants, parents, enfants };
  } catch (error) {
    console.error("   ❌ Erreur lors du seeding des users:", error.message);
    throw error;
  }
}

export default seedUsers;

// Exécuter le script directement s'il est lancé en tant que fichier principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = await import("mongoose");
  const { connectMongo } = await import("../db/db.js");

  try {
    await connectMongo();
    await seedUsers();
    await mongoose.default.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
