import { param, body } from "express-validator";

// Une brique de lego réutilisable juste pour l'ID
const validateIdParam = [
  param("id").isMongoId().withMessage("ID must be a valid MongoDB ID"),
];

export default validateIdParam;
