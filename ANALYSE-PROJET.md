# Analyse du projet PSF Express API

> Guide pour comprendre l'architecture et le fonctionnement du backend "Pieds Sans Frontières"

---

## Vue d'ensemble

**Stack technique :**
- Node.js avec Express.js
- MongoDB avec Mongoose (ODM)
- JWT pour l'authentification
- Cloudinary pour l'hébergement d'images
- Web Push pour les notifications
- Docker pour le déploiement

**Structure des dossiers :**
```
├── app.js                    # Configuration Express (middlewares, routes)
├── bin/
│   └── start.js              # Point d'entrée (connexion DB + démarrage serveur)
├── controllers/              # Logique métier
│   ├── authController.js
│   ├── userController.js
│   ├── campController.js
│   ├── hikeController.js
│   └── itemController.js
├── routes/                   # Définition des endpoints
│   ├── auth.js
│   ├── users.js
│   ├── camps.js
│   ├── hikes.js
│   ├── items.js
│   └── push.js
├── models/                   # Schémas Mongoose
│   ├── User.model.js
│   ├── Camp.model.js
│   ├── Hike.model.js
│   ├── Item.model.js
│   └── PushSubscription.model.js
├── middlewares/              # Middlewares Express
│   ├── auth.js               # JWT + contrôle d'accès
│   ├── errorHandler.js       # Gestion globale des erreurs
│   ├── fileUpload.js         # Upload Cloudinary
│   └── handleValidationErrors.js
├── validators/               # Validation des entrées
├── utils/                    # Utilitaires (GPX, géolocalisation)
├── db/
│   └── db.js                 # Connexion MongoDB
├── seeders/                  # Données de test
└── openapi.yml               # Documentation Swagger
```

---

## 1. Base de données (MongoDB + Mongoose)

### Connexion

**Fichier :** `/db/db.js`

```javascript
const isTest = process.env.NODE_ENV === "test";
const uri = isTest ? process.env.MONGO_URI_TEST : process.env.MONGO_URI;

async function connectMongo() {
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
```

### Les modèles (Schémas)

#### User.model.js

**Champs principaux :**
```javascript
{
  role: ['admin' | 'accompagnant' | 'parent' | 'enfant'],  // Array de rôles
  lastname: String,           // Requis, 1-50 caractères
  firstname: String,          // Requis, 1-50 caractères
  email: String,              // Unique, lowercase
  password: String,           // Hashé avec bcrypt (12 rounds)
  phoneNumber: String,        // Auto-normalisé
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String
  },
  parent: ObjectId,           // Référence au parent (pour les enfants)
  children: [ObjectId],       // Références aux enfants
  camps: [ObjectId],          // Camps auxquels l'user participe
  participationInfo: {
    birthDate: Date,
    tshirtInfo: { size, color },
    allergies: String,
    medications: String,
    insuranceInfo: { ... },
    hasPaid: Boolean
  }
}
```

**Hooks (pre-save) :**
- Hash automatique du mot de passe avec bcrypt
- Normalisation du numéro de téléphone

**Méthodes :**
```javascript
// Comparaison de mot de passe
user.comparePassword(candidatePassword)  // Retourne true/false
```

#### Camp.model.js

**Champs principaux :**
```javascript
{
  title: String,              // Requis, unique
  status: 'draft' | 'published' | 'archived',
  startDate: Date,
  endDate: Date,
  subStartDatetime: Date,     // Début des inscriptions
  subEndDatetime: Date,       // Fin des inscriptions
  gpsTrack: Object,           // Données GPS
  itemsList: [{               // Liste d'équipement
    item: ObjectId,
    quantity: Number
  }],
  trainings: [{               // Entraînements (sous-documents)
    date: Date,
    meetingPoint: String,
    meetingTime: String,
    distance: Number,
    elevationGain: Number,
    gpsTrack: {               // GeoJSON LineString
      type: 'LineString',
      coordinates: [[lng, lat], ...]
    },
    itemsList: [...]
  }],
  infoEvening: { ... },       // Soirée d'info
  fundraisings: [...],        // Événements de collecte
  generalMeeting: { ... },    // Réunion générale
  stages: [...]               // Étapes du camp
}
```

#### Hike.model.js

```javascript
{
  user: ObjectId,             // Référence à l'utilisateur (requis)
  content: String,            // Texte, max 2000 caractères
  imageUrl: String,           // URL Cloudinary
  createdAt: Date,            // Auto
  updatedAt: Date             // Auto
}
```

#### Item.model.js

```javascript
{
  slug: String,               // Identifiant unique (ex: "sac-a-dos")
  name: String,               // Nom affiché (ex: "Sac à dos")
  description: String
}
```

#### PushSubscription.model.js

```javascript
{
  endpoint: String,           // URL unique du navigateur
  keys: {
    p256dh: String,           // Clé publique
    auth: String              // Secret d'auth
  }
}
```

---

## 2. Authentification

### JWT (JSON Web Token)

**Fichier middleware :** `/middlewares/auth.js`

**Configuration :**
```
JWT_SECRET=ma_cle_secrete
JWT_EXPIRES_IN=7d
```

### Middleware `authenticate`

Vérifie le token JWT et charge l'utilisateur :

```javascript
async function authenticate(req, res, next) {
  // 1. Extraire le token du header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  const token = authHeader.split(' ')[1];

  // 2. Vérifier le token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Charger l'utilisateur
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non trouvé' });
  }

  // 4. Attacher à la requête
  req.user = user;
  next();
}
```

### Middleware `restrictTo(...roles)`

Contrôle d'accès basé sur les rôles :

```javascript
function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    // Vérifie si l'user a au moins un des rôles requis
    const hasRole = allowedRoles.some(role =>
      req.user.role.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    next();
  };
}
```

**Hiérarchie des rôles :**
```
admin        → peut tout faire
accompagnant → peut gérer les hikes, voir les users
parent       → peut gérer son profil et ses enfants
enfant       → profil limité
```

### Middleware `restrictToSelfOrAdmin`

Permet de modifier uniquement son propre profil (ou admin peut tout modifier) :

```javascript
function restrictToSelfOrAdmin(req, res, next) {
  const targetId = req.params.id;
  const currentUser = req.user;

  // Admin peut tout faire
  if (currentUser.role.includes('admin')) return next();

  // User peut modifier son propre profil
  if (currentUser._id.toString() === targetId) return next();

  // Parent peut modifier ses enfants
  if (currentUser.children?.includes(targetId)) return next();

  return res.status(403).json({ message: 'Non autorisé' });
}
```

### Contrôleur Auth

**Fichier :** `/controllers/authController.js`

```javascript
// Inscription
async function signup(req, res) {
  const user = await User.create({
    ...req.body,
    role: ['parent']  // Tous les nouveaux users sont parents
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({ token, user });
}

// Connexion
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.json({ token, user });
}
```

---

## 3. Routes et Endpoints

### Configuration des routes

**Fichier :** `/app.js`

```javascript
app.use('/push', pushRouter);
app.use('/', authRouter);        // /login, /signup, /logout
app.use('/items', itemsRouter);
app.use('/users', usersRouter);
app.use('/camps', campsRouter);
app.use('/hikes', hikesRouter);
app.use('/api-docs', swaggerUi);  // Documentation Swagger
```

### Tableau des endpoints

#### Auth (`/`)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/signup` | Créer un compte | Non |
| POST | `/login` | Se connecter | Non |
| POST | `/logout` | Se déconnecter | Non |

#### Users (`/users`)

| Méthode | Endpoint | Description | Auth requise | Rôle |
|---------|----------|-------------|--------------|------|
| GET | `/` | Liste des users | Oui | parent+ |
| GET | `/:id` | Détail d'un user | Oui | parent+ |
| POST | `/` | Créer un user (enfant) | Oui | parent+ |
| PUT | `/:id` | Modifier un user | Oui | self/admin |
| DELETE | `/:id` | Supprimer un user | Oui | admin |

**Filtres disponibles sur GET /users :**
- `?role=admin` ou `accompagnant` ou `parent` ou `enfant`
- `?parentId=xxx` - enfants d'un parent
- `?campId=xxx` - participants d'un camp
- `?hasPaid=true` ou `false`
- `?page=1&limit=10` - pagination

#### Camps (`/camps`)

| Méthode | Endpoint | Description | Auth requise | Rôle |
|---------|----------|-------------|--------------|------|
| GET | `/` | Liste des camps | Non | - |
| GET | `/:id` | Détail d'un camp | Non | - |
| POST | `/` | Créer un camp | Oui | admin |
| PUT | `/:id` | Modifier un camp | Oui | admin |
| DELETE | `/:id` | Supprimer un camp | Oui | admin |

**Filtres sur GET /camps :**
- `?status=draft` ou `published` ou `archived`

**Sous-routes Items :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/:campId/items` | Liste équipement du camp |
| POST | `/:campId/items` | Ajouter un item |
| PUT | `/:campId/item/:itemId` | Modifier quantité |
| DELETE | `/:campId/item/:itemId` | Retirer un item |

**Sous-routes Trainings :**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/:campId/trainings` | Liste des entraînements |
| GET | `/:campId/trainings/:id` | Détail d'un entraînement |
| POST | `/:campId/trainings` | Créer (avec fichier GPX) |
| PUT | `/:campId/trainings/:id` | Modifier |
| DELETE | `/:campId/trainings/:id` | Supprimer |

#### Hikes (`/hikes`)

| Méthode | Endpoint | Description | Auth requise | Rôle |
|---------|----------|-------------|--------------|------|
| GET | `/` | Liste des hikes | Oui | accompagnant+ |
| POST | `/` | Créer un hike | Oui | accompagnant+ |
| DELETE | `/:hikeId` | Supprimer un hike | Oui | accompagnant+ |

#### Items (`/items`)

| Méthode | Endpoint | Description | Auth requise | Rôle |
|---------|----------|-------------|--------------|------|
| GET | `/` | Liste des items | Oui | admin |
| GET | `/:id` | Détail d'un item | Oui | admin |
| POST | `/` | Créer un item | Oui | admin |
| PUT | `/:id` | Modifier un item | Oui | admin |
| DELETE | `/:id` | Supprimer un item | Oui | admin |

#### Push Notifications (`/push`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/vapidPublicKey` | Clé publique pour le client |
| POST | `/subscribe` | S'abonner aux notifications |
| POST | `/unsubscribe` | Se désabonner |
| POST | `/welcome` | Test de notification |

---

## 4. Validation des entrées

### Framework : express-validator

**Pattern utilisé :**
1. Définir les règles dans `/validators/`
2. Appliquer sur la route
3. Middleware `validateRequest` vérifie les erreurs
4. Retourne 400 si invalide

### Exemple de validation

**Fichier :** `/validators/authValidator.js`

```javascript
const validateSignup = [
  body('email')
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .custom(async (email) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error('Email déjà utilisé');
    }),

  body('password')
    .notEmpty().withMessage('Mot de passe requis')
    .isLength({ min: 6 }).withMessage('Minimum 6 caractères'),

  body('firstname')
    .notEmpty().withMessage('Prénom requis')
    .isLength({ min: 1, max: 20 }),

  body('lastname')
    .notEmpty().withMessage('Nom requis')
    .isLength({ min: 1, max: 20 }),
];
```

**Utilisation dans la route :**

```javascript
// routes/auth.js
router.post('/signup',
  validateSignup,           // Règles de validation
  validateRequest,          // Vérifie les erreurs
  authController.signup     // Controller
);
```

### Middleware validateRequest

**Fichier :** `/middlewares/handleValidationErrors.js`

```javascript
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
}
```

### Types de validations

| Type | Exemple |
|------|---------|
| Champ requis | `.notEmpty()` |
| Email | `.isEmail()` |
| Longueur | `.isLength({ min: 1, max: 50 })` |
| Enum | `.isIn(['draft', 'published', 'archived'])` |
| ObjectId | `.isMongoId()` |
| Date | `.isISO8601()` |
| Numérique | `.isInt()`, `.isFloat()` |
| Custom | `.custom(async (value) => { ... })` |

---

## 5. Gestion des erreurs

### Middleware global

**Fichier :** `/middlewares/errorHandler.js`

```javascript
function errorHandler(err, req, res, next) {
  // Log sauf en mode test
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // ID MongoDB invalide
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID invalide' });
  }

  // Doublon (clé unique)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Cette ressource existe déjà' });
  }

  // Erreur HTTP (via http-errors)
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Erreur serveur'
  });
}
```

### Utilisation dans les controllers

```javascript
const createError = require('http-errors');

async function getCamp(req, res) {
  const camp = await Camp.findById(req.params.id);

  if (!camp) {
    throw createError(404, 'Camp non trouvé');
  }

  res.json(camp);
}
```

---

## 6. Upload de fichiers

### Cloudinary (images)

**Fichier :** `/middlewares/fileUpload.js`

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hikes-app',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }]
  }
});

const fileUpload = multer({ storage });
```

**Utilisation dans une route :**

```javascript
// routes/hikes.js
router.post('/',
  authenticate,
  restrictTo('accompagnant', 'admin'),
  fileUpload.single('image'),    // Champ "image" du form
  validateCreateHike,
  validateRequest,
  hikeController.createHike
);
```

**Dans le controller :**

```javascript
async function createHike(req, res) {
  const hike = await Hike.create({
    user: req.user._id,
    content: req.body.content,
    imageUrl: req.file?.path  // URL Cloudinary
  });

  res.status(201).json(hike);
}
```

### GPX (fichiers GPS)

**Fichier :** `/utils/gpxHandler.js`

```javascript
const toGeoJSON = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

function parseGpxToCoordinates(gpxBuffer) {
  const gpxString = gpxBuffer.toString('utf-8');
  const doc = new DOMParser().parseFromString(gpxString);
  const geoJson = toGeoJSON.gpx(doc);

  // Extraire les coordonnées du premier track
  const track = geoJson.features.find(f =>
    f.geometry.type === 'LineString'
  );

  if (!track || track.geometry.coordinates.length < 2) {
    throw new Error('Fichier GPX invalide');
  }

  return track.geometry.coordinates;  // [[lng, lat], ...]
}
```

---

## 7. Push Notifications

### Configuration Web Push

**Fichier :** `/webpush.js`

```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,      // 'https://mon-app.com'
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = webpush;
```

### Envoyer une notification

**Exemple : quand un camp est publié**

```javascript
// controllers/campController.js
async function updateCamp(req, res) {
  const camp = await Camp.findByIdAndUpdate(req.params.id, req.body, { new: true });

  // Si le camp passe en "published", notifier tout le monde
  if (req.body.status === 'published') {
    const subscriptions = await PushSubscription.find();

    const payload = JSON.stringify({
      title: 'Nouveau camp publié',
      body: camp.title
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        // Si la souscription est expirée, la supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
  }

  res.json(camp);
}
```

### Gérer les souscriptions

```javascript
// routes/push.js

// S'abonner
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { endpoint, keys },
    { upsert: true }  // Crée si n'existe pas
  );

  res.json({ message: 'Subscribed' });
});

// Se désabonner
router.post('/unsubscribe', async (req, res) => {
  await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
  res.json({ message: 'Unsubscribed' });
});
```

---

## 8. Utilitaires

### Géolocalisation

**Fichier :** `/utils/geoUtils.js`

```javascript
// Calcul de distance entre 2 points (formule de Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  // ... calcul
  return distance;
}

// Générer une bounding box pour requêtes géospatiales
function getBoundingBox(lat, lon, radiusKm) {
  // Retourne { minLat, maxLat, minLon, maxLon }
}
```

### Suppression d'image Cloudinary

**Fichier :** `/utils/cloudinaryHelper.js`

```javascript
async function deleteImage(imageUrl) {
  // Extraire le public_id de l'URL
  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  if (!match) return;

  const publicId = match[1];
  await cloudinary.uploader.destroy(publicId);
}
```

---

## 9. Configuration et environnement

### Variables d'environnement

**Fichier `.env` (exemple) :**

```bash
# Serveur
APP_PORT=2001
APP_HOST=0.0.0.0
NODE_ENV=development

# JWT
JWT_SECRET=ma_super_cle_secrete
JWT_EXPIRES_IN=7d

# MongoDB
MONGO_URI=mongodb://user:pass@localhost:27017/psf
MONGO_URI_TEST=mongodb://user:pass@localhost:27017/psf_test

# Cloudinary
CLOUDINARY_CLOUD_NAME=mon_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123

# Web Push (VAPID)
VAPID_PUBLIC_KEY=BLxx...
VAPID_PRIVATE_KEY=abc...
VAPID_SUBJECT=https://mon-app.com

# Admin initial
ADMIN_MAIL=admin@example.com
ADMIN_PASSWORD=password123
ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=PSF
```

### Docker

**Fichier `docker-compose.dev.yaml` :**

```yaml
services:
  api:
    build: .
    ports:
      - "2001:2001"
    environment:
      - NODE_ENV=development
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=example
```

### Seeders (données de test)

**Commande :** `npm run seed`

Fichiers dans `/seeders/` :
- `1-item.seeder.js` - Items de base
- `2-user.seeder.js` - Utilisateurs de test
- `3-camp.seeder.js` - Camps de test
- `4-hike.seeder.js` - Hikes de test
- `admin.seeder.js` - Créer l'admin initial

---

## Résumé : Comment retrouver les choses

| Tu cherches... | Va dans... |
|----------------|------------|
| Point d'entrée | `/bin/start.js` |
| Configuration Express | `/app.js` |
| Connexion MongoDB | `/db/db.js` |
| Schéma User | `/models/User.model.js` |
| Schéma Camp | `/models/Camp.model.js` |
| Auth (JWT, rôles) | `/middlewares/auth.js` |
| Routes Users | `/routes/users.js` |
| Routes Camps | `/routes/camps.js` |
| Validation | `/validators/*.js` |
| Gestion erreurs | `/middlewares/errorHandler.js` |
| Upload images | `/middlewares/fileUpload.js` |
| Push notifications | `/routes/push.js` + `/webpush.js` |
| Documentation API | `/openapi.yml` ou `/api-docs` |

---

## Points forts à mentionner en présentation

1. **Architecture MVC** : séparation routes → controllers → models
2. **Auth complète** : JWT, rôles hiérarchiques, middleware de contrôle d'accès
3. **Validation robuste** : express-validator avec validations custom async
4. **CRUD complet** sur Users, Camps, Trainings, Hikes, Items
5. **Sous-ressources** : Trainings et Items sont des sous-documents de Camp
6. **Push notifications** : Web Push avec VAPID, nettoyage auto des souscriptions expirées
7. **Upload fichiers** : Images via Cloudinary, GPX parsé en GeoJSON
8. **Géolocalisation** : Support des tracks GPS, calcul de distances
9. **Gestion d'erreurs centralisée** : Middleware global avec codes appropriés
10. **Docker-ready** : Containerisation pour le déploiement
