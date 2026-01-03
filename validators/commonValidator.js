import { param, body } from "express-validator";

const validateObjectId = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`Le paramètre '${paramName}' doit être un ID valide`),
];

export default validateObjectId;
