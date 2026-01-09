import { query } from "express-validator";

//PAGINATION
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

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

//CAMPS
export const validateFilterStatus = [
  query("status")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["draft", "published", "archived"])
    .withMessage("Filter 'status' must be one of : draft, published, archived"),
];
