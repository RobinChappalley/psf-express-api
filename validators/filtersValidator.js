import { query } from "express-validator";

//COMMON
export const validateFilterReference = (...refNames) => {
  return refNames.flatMap((refName) =>
    query(refName)
      .optional()
      .isMongoId()
      .withMessage(`The parameter '${refName}' must be a valid ObjectId`)
  );
};

//USERS
export const validateFilterRoles = [
  query("role")
    .optional()
    .isIn(["enfant", "parent", "accompagnant", "admin"])
    .withMessage(
      "Filter 'role' must be one of : enfant, parent, accompagnant, admin"
    ),
];

export const validateFilterHasPaid = [
  query("hasPaid")
    .optional()
    .isBoolean()
    .withMessage("Filter 'hasPaid' must be a boolean"),
];
