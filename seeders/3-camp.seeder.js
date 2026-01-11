import Camp from "../models/Camp.model.js";
import User from "../models/User.model.js";
import Item from "../models/Item.model.js";

/**
 * Seeds camps avec trainings, stages, fundraisings, etc.
 */
export async function seedCamps() {
  try {
    console.log("⛺ Seeding Camps...");

    // Supprimer tous les camps existants
    await Camp.deleteMany({});
    console.log("   🗑️  Camps existants supprimés");

    // Récupérer des utilisateurs et items pour les relations
    const accompagnants = await User.find({ role: "accompagnant" }).limit(3);
    const enfants = await User.find({ role: "enfant" }).limit(6);
    const items = await Item.find().limit(20);

    if (accompagnants.length === 0 || items.length === 0) {
      throw new Error(
        "Veuillez d'abord exécuter les seeders user.seeder.js et item.seeder.js"
      );
    }

    // Camp 1: Camp d'été Vaud 2025
    const camp1 = await Camp.create({
      title: "Camp d'été Vaud 2025",
      startDate: new Date("2025-07-05"),
      endDate: new Date("2025-07-19"),
      subStartDatetime: new Date("2025-05-01T00:00:00Z"),
      subEndDatetime: new Date("2025-06-15T23:59:59Z"),
      itemsList: [
        { item: items[0]._id, quantity: 15 }, // Sacs à dos
        { item: items[1]._id, quantity: 15 }, // Sacs de couchage
        { item: items[2]._id, quantity: 15 }, // Matelas
        { item: items[3]._id, quantity: 8 }, // Tentes
        { item: items[4]._id, quantity: 5 }, // Réchauds
      ],
      infoEvening: {
        dateTime: new Date("2025-06-20T19:00:00Z"),
        location: "Salle polyvalente, Lausanne",
        participants: [
          { email: "parent1@example.com", nbOfParticipants: 2 },
          { email: "parent2@example.com", nbOfParticipants: 3 },
        ],
      },
      generalMeeting: {
        dateTime: new Date("2025-04-15T18:30:00Z"),
        location: "Café de la Gare, Lausanne",
        participants: [
          { email: "accompagnant1@example.com", nbOfParticipants: 1 },
          { email: "accompagnant2@example.com", nbOfParticipants: 1 },
        ],
      },
      trainings: [
        {
          date: new Date("2025-06-07"),
          trainGoingTime: "08:45",
          trainReturnTime: "18:30",
          meetingTime: "09:15",
          meetingPoint: "Gare de Lausanne",
          returnTime: "18:00",
          distance: 12.5,
          elevationGain: 450,
          elevationLoss: 420,
          responsiblePerson: accompagnants[0]._id,
          gpsTrack: {
            type: "LineString",
            // Tracé autour de Lausanne (Lavaux)
            coordinates: [
              [6.6323, 46.5197], // Lausanne centre
              [6.645, 46.515], // Vers Pully
              [6.658, 46.51], // Lutry
              [6.672, 46.505], // Cully
              [6.685, 46.5], // Riex
              [6.678, 46.508], // Retour
              [6.665, 46.512],
              [6.65, 46.517],
              [6.635, 46.519],
            ],
          },
          itemsList: [
            { itemId: items[8]._id, quantity: 15 }, // Bâtons
            { itemId: items[7]._id, quantity: 15 }, // Gourdes
          ],
          remark: "Premier entraînement - niveau facile",
        },
        {
          date: new Date("2025-06-14"),
          trainGoingTime: "08:30",
          trainReturnTime: "19:00",
          meetingTime: "09:00",
          meetingPoint: "Gare de Montreux",
          returnTime: "18:30",
          distance: 16.8,
          elevationGain: 680,
          elevationLoss: 650,
          responsiblePerson: accompagnants[1]._id,
          gpsTrack: {
            type: "LineString",
            // Tracé autour de Montreux (Rochers-de-Naye)
            coordinates: [
              [6.9116, 46.4312], // Montreux
              [6.92, 46.435], // Vers Glion
              [6.93, 46.44],
              [6.945, 46.45], // Montée
              [6.96, 46.46],
              [6.97, 46.465], // Sommet approche
              [6.955, 46.458], // Retour
              [6.94, 46.448],
              [6.925, 46.438],
              [6.915, 46.432],
            ],
          },
          itemsList: [
            { itemId: items[8]._id, quantity: 15 }, // Bâtons
            { itemId: items[12]._id, quantity: 3 }, // Trousses premiers secours
          ],
          remark: "Entraînement intermédiaire - dénivelé important",
        },
        {
          date: new Date("2025-06-21"),
          trainGoingTime: "08:00",
          trainReturnTime: "19:30",
          meetingTime: "08:30",
          meetingPoint: "Gare de Martigny",
          returnTime: "19:00",
          distance: 14.2,
          elevationGain: 850,
          elevationLoss: 820,
          responsiblePerson: accompagnants[2]._id,
          gpsTrack: {
            type: "LineString",
            // Tracé Val de Bagnes
            coordinates: [
              [7.0748, 46.1002], // Martigny
              [7.09, 46.095],
              [7.11, 46.09],
              [7.135, 46.088], // Vers Verbier
              [7.15, 46.092],
              [7.165, 46.098],
              [7.175, 46.105],
              [7.165, 46.11], // Retour
              [7.145, 46.105],
              [7.12, 46.1],
              [7.09, 46.098],
            ],
          },
          remark: "Entraînement avancé - préparation camp",
        },
      ],
      fundraisings: [
        {
          dateTime: new Date("2025-05-10T10:00:00Z"),
          location: "Place de la Palud, Lausanne",
          participants: [enfants[0]._id, enfants[1]._id, enfants[2]._id],
        },
        {
          dateTime: new Date("2025-06-01T14:00:00Z"),
          location: "Marché de Vevey",
          participants: [enfants[3]._id, enfants[4]._id],
        },
      ],
      stages: [
        {
          date: new Date("2025-07-06"),
          startPoint: "Lausanne",
          endPoint: "Montreux",
          distance: 28.5,
          elevationGain: 420,
          elevationLoss: 380,
          routeDescription: "Parcours le long du lac Léman via Lavaux",
        },
        {
          date: new Date("2025-07-07"),
          startPoint: "Montreux",
          endPoint: "Col de Jaman",
          distance: 18.3,
          elevationGain: 1250,
          elevationLoss: 150,
          routeDescription: "Montée technique vers le col",
        },
        {
          date: new Date("2025-07-08"),
          startPoint: "Col de Jaman",
          endPoint: "Gruyères",
          distance: 22.7,
          elevationGain: 450,
          elevationLoss: 1100,
          routeDescription: "Descente vers la Gruyère",
        },
      ],
    });

    console.log(`   ✅ Camp créé: ${camp1.title}`);
    console.log(`      - ${camp1.trainings.length} trainings avec GPS`);
    console.log(`      - ${camp1.stages.length} stages`);
    console.log(`      - ${camp1.fundraisings.length} fundraisings`);

    // Camp 2: Camp d'été Valais 2025
    const camp2 = await Camp.create({
      title: "Camp d'été Valais 2024",
      startDate: new Date("2024-08-02"),
      endDate: new Date("2024-08-16"),
      subStartDatetime: new Date("2024-06-01T00:00:00Z"),
      subEndDatetime: new Date("2024-07-10T23:59:59Z"),
      itemsList: [
        { item: items[0]._id, quantity: 12 },
        { item: items[1]._id, quantity: 12 },
        { item: items[15]._id, quantity: 12 }, // Corde
        { item: items[18]._id, quantity: 12 }, // Casque
      ],
      trainings: [
        {
          date: new Date("2024-07-05"),
          trainGoingTime: "07:30",
          trainReturnTime: "20:00",
          meetingTime: "08:00",
          meetingPoint: "Gare de Sion",
          returnTime: "19:30",
          distance: 18.5,
          elevationGain: 920,
          elevationLoss: 900,
          responsiblePerson: accompagnants[0]._id,
          gpsTrack: {
            type: "LineString",
            // Tracé Val d'Hérens
            coordinates: [
              [7.3603, 46.23], // Sion
              [7.38, 46.21],
              [7.4, 46.195],
              [7.42, 46.185], // Vers Evolène
              [7.44, 46.18],
              [7.455, 46.185],
              [7.47, 46.195],
              [7.46, 46.205], // Retour
              [7.435, 46.21],
              [7.41, 46.22],
            ],
          },
          remark: "Reconnaissance Val d'Hérens",
        },
        {
          date: new Date("2024-07-19"),
          trainGoingTime: "07:00",
          trainReturnTime: "20:30",
          meetingTime: "07:30",
          meetingPoint: "Gare de Viège",
          returnTime: "20:00",
          distance: 22.3,
          elevationGain: 1150,
          elevationLoss: 1100,
          responsiblePerson: accompagnants[1]._id,
          gpsTrack: {
            type: "LineString",
            // Tracé Saas-Fee
            coordinates: [
              [7.878, 46.295], // Viège
              [7.9, 46.28],
              [7.92, 46.265],
              [7.94, 46.25],
              [7.96, 46.24], // Vers Saas-Fee
              [7.975, 46.235],
              [7.985, 46.24],
              [7.97, 46.25], // Retour
              [7.95, 46.26],
              [7.925, 46.275],
            ],
          },
          remark: "Haute montagne - préparation glaciers",
        },
      ],
      stages: [
        {
          date: new Date("2024-08-03"),
          startPoint: "Sion",
          endPoint: "Cabane des Dix",
          distance: 16.8,
          elevationGain: 1450,
          elevationLoss: 200,
          routeDescription: "Montée à la cabane via Val d'Hérémence",
        },
        {
          date: new Date("2024-08-04"),
          startPoint: "Cabane des Dix",
          endPoint: "Arolla",
          distance: 14.2,
          elevationGain: 650,
          elevationLoss: 1300,
          routeDescription: "Passage de col, vue sur glacier",
        },
      ],
    });

    console.log(`   ✅ Camp créé: ${camp2.title}`);
    console.log(`      - ${camp2.trainings.length} trainings avec GPS`);
    console.log(`      - ${camp2.stages.length} stages`);

    // Mettre à jour les utilisateurs avec leurs camps
    await User.updateMany(
      { _id: { $in: enfants.slice(0, 3).map((e) => e._id) } },
      { $push: { camps: camp1._id } }
    );

    await User.updateMany(
      { _id: { $in: enfants.slice(3, 6).map((e) => e._id) } },
      { $push: { camps: camp2._id } }
    );

    console.log("   ✅ Utilisateurs liés aux camps");

    return [camp1, camp2];
  } catch (error) {
    console.error("   ❌ Erreur lors du seeding des camps:", error.message);
    throw error;
  }
}

export default seedCamps;

// Exécuter le script directement s'il est lancé en tant que fichier principal
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = await import("mongoose");
  const { connectMongo } = await import("../db/db.js");

  try {
    await connectMongo();
    await seedCamps();
    await mongoose.default.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
