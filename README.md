# API Express.js avec MongoDB

## À propos du projet

Ce projet est une API développée dans le cadre d'un projet scolaire. Il utilise les technologies suivantes :

- Express.js comme framework backend
- MongoDB comme base de données
- Mongoose comme ODM (Object Document Mapper)
- Docker pour la conteneurisation

## Prérequis

- Docker
- Docker Compose

## Installation et lancement

Pour installer et lancer le projet en local, exécutez la commande suivante :

```bash
docker compose -f docker-compose.dev.yaml up --build
```

Cette commande va :

1. Construire les images Docker nécessaires
2. Lancer les conteneurs requis
3. Démarrer l'application en mode développement

## Tout détruire et recommencer à neuf

```bash
docker compose -f docker-compose.dev.yaml down -v
```

Cette commande va

1. Arrêter les deux conteneurs (Mongo et l'app express)
2. Supprimer le volume docker de mongo
3. Supprimer le réseaux docker

## Bruno

Burno est un [client API Open source](https://www.usebruno.com/), idéal pour documenter les requêtes effectuées. Chaque requête est un fichier .bru qui se trouve dans le dossier "test-requests"

## Tests

Puisque que l'API utilise docker, npm test ne va pas fonctionner, il faut donc lancer les tests avec la commande suivante :

`docker exec nom-du-conteneur npm test`

soit dans notre cas :

```bash
docker exec psf-express-api-express-api-1 npm test
```

## Seeders

Puisque que l'API utilise docker, npm run seed ne va pas fonctionner, il faut donc lancer les tests avec la commande suivante :

`docker exec nom-du-conteneur npm run seed`

soit dans notre cas :

```bash
docker exec psf-express-api-express-api-1 npm run seed
```

## Technologies utilisées

- 🚀 [Express.js](https://expressjs.com/)
- 📦 [MongoDB](https://www.mongodb.com/)
- 🔄 [Mongoose](https://mongoosejs.com/)
- 🐳 [Docker](https://www.docker.com/)

## Production

1. Copier l'exemple du .env de production:

```bash
cp .env.prod.example .env.prod
```

2. Changer les placeholders par les vraies valeurs

3. Pour intégrer directement les variables d'environnement créées au point 2 , il faut utiliser la commande suivante :

```bash
docker-compose --env-file .env.prod -f docker-compose.prod.yaml up --build
```
