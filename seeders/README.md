# Seeders PSF Express API

Ce dossier contient les seeders pour peupler la base de données avec des données de test.

## Structure

Les seeders sont exécutés dans l'ordre alphabétique :

1. **admin.seeder.js** - Crée le compte administrateur principal
2. **1-item.seeder.js** - Crée les items (matériel de camp)
3. **2-user.seeder.js** - Crée les utilisateurs (accompagnants, parents, enfants)
4. **3-camp.seeder.js** - Crée les camps avec trainings GPS, stages, fundraisings
5. **4-hike.seeder.js** - Crée les publications/récits de randonnées

## Utilisation

### Exécuter tous les seeders

```bash
npm run seed
```

Ou directement :

```bash
node run-seeders.js
```

### Exécuter un seeder spécifique

```bash
node seeders/admin.seeder.js
node seeders/1-item.seeder.js
node seeders/2-user.seeder.js
node seeders/3-camp.seeder.js
node seeders/4-hike.seeder.js
```

## Prérequis

### Variables d'environnement

Le seeder admin nécessite les variables suivantes dans `.env` :

```env
ADMIN_MAIL=admin@example.com
ADMIN_PASSWORD=votremotdepasse
```

### Ordre d'exécution

Pour éviter les erreurs de références, respectez cet ordre :

1. Items (avant camps)
2. Users (avant camps et hikes)
3. Camps (après items et users)
4. Hikes (après users)

L'exécution via `npm run seed` gère automatiquement cet ordre.

## Données créées

### Admin (admin.seeder.js)
- 1 administrateur (si variables d'environnement configurées)

### Items (1-item.seeder.js)
- 20 items de matériel de camp
  - Sacs à dos, tentes, réchauds
  - Matériel d'alpinisme (cordes, mousquetons, crampons)
  - Équipements divers

### Users (2-user.seeder.js)
- 3 accompagnants
- 4 parents
- 6 enfants (avec informations de participation complètes)
- Relations parent-enfant établies

**Credentials de test :**
- Accompagnants : `sophie.martin@example.com` / `password123`
- Parents : `jean.dupont@example.com` / `password123`
- Enfants : pas d'email/password (liés aux parents)

### Camps (3-camp.seeder.js)
- 2 camps complets :
  - **Camp d'été Vaud 2025** (juillet)
    - 3 trainings avec coordonnées GPS réalistes (Lavaux, Montreux, Martigny)
    - 3 stages
    - 2 fundraisings
    - Info evening
    - General meeting

  - **Camp d'été Valais 2025** (août)
    - 2 trainings avec coordonnées GPS (Val d'Hérens, Saas-Fee)
    - 2 stages

**Coordonnées GPS des trainings :**
- Training 1 (Vaud) : Tracé autour de Lausanne (Lavaux) - ~13 km
- Training 2 (Vaud) : Montreux - Rochers-de-Naye - ~17 km
- Training 3 (Vaud) : Val de Bagnes - ~14 km
- Training 1 (Valais) : Val d'Hérens - ~19 km
- Training 2 (Valais) : Saas-Fee - ~22 km

### Hikes (4-hike.seeder.js)
- 10 publications variées
  - Récits d'accompagnants
  - Posts d'enfants
  - Avec et sans images

## Nettoyer la base

Les seeders suppriment automatiquement les données existantes avant d'insérer les nouvelles (sauf admin).

Pour nettoyer manuellement :

```javascript
// Dans mongo shell ou script
await Item.deleteMany({});
await User.deleteMany({ role: { $ne: "admin" } });
await Camp.deleteMany({});
await Hike.deleteMany({});
```

## Tester l'API nearest training

Après avoir exécuté les seeders, vous pouvez tester l'endpoint de recherche d'entraînement le plus proche :

```bash
# Position Lausanne (devrait retourner Training 1 du Camp Vaud)
GET /camps/trainings/nearest?latitude=46.5197&longitude=6.6323&maxDistance=100

# Position Montreux (devrait retourner Training 2 du Camp Vaud)
GET /camps/trainings/nearest?latitude=46.4312&longitude=6.9116&maxDistance=100

# Position Sion (devrait retourner Training 1 du Camp Valais)
GET /camps/trainings/nearest?latitude=46.2300&longitude=7.3603&maxDistance=100
```

## Développement

Pour créer un nouveau seeder :

1. Créer un fichier `N-nom.seeder.js` (N = numéro d'ordre)
2. Importer les modèles nécessaires
3. Exporter une fonction par défaut qui :
   - Log le début avec console.log
   - Supprime les données existantes (si nécessaire)
   - Crée les nouvelles données
   - Retourne les données créées
4. Ajouter la gestion de l'exécution directe :

```javascript
export default async function seedNom() {
  try {
    console.log("🔧 Seeding Nom...");
    // Logique de seed
    console.log("   ✅ X items créés");
    return data;
  } catch (error) {
    console.error("   ❌ Erreur:", error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = await import("mongoose");
  const { connectMongo } = await import("../db/db.js");
  try {
    await connectMongo();
    await seedNom();
    await mongoose.default.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
```
