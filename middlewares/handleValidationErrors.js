import { validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log("Validation errors:");
  if (!errors.isEmpty()) {
    // Si express-validator a trouvé des erreurs, on arrête tout ici (400)
    return res.status(400).json({ errors: errors.array() });
  }

  // Sinon, la voie est libre, on passe au contrôleur
  next();
};

//ce fichier se charge de valider que les requêtes respectent les règles définies dans les validateurs.
//c'est le "videur de la boîte" qui empêche les mauvaises requêtes d'atteindre les contrôleurs.
export default validateRequest;
