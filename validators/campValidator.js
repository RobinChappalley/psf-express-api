import { body } from "express-validator";
import validateIdParam from "./commonValidator.js";
// Email regex: must contain @ and . at the end
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateCreateCamp = [
  // Title validation
  body("title").trim().notEmpty().withMessage("Title is required"),

  // Dates validation
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.startDate &&
        new Date(value) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("subStartDatetime")
    .optional()
    .isISO8601()
    .withMessage("Subscription start datetime must be a valid ISO8601 date"),

  body("subEndDatetime")
    .optional()
    .isISO8601()
    .withMessage("Subscription end datetime must be a valid ISO8601 date"),

  // GPS Track validation (no constraints)
  body("gpsTrack")
    .optional()
    .isObject()
    .withMessage("GPS track must be an object"),

  // Items List validation
  body("itemsList")
    .optional()
    .isArray()
    .withMessage("Items list must be an array"),

  body("itemsList.*.item")
    .optional()
    .isMongoId()
    .withMessage("Item reference must be a valid MongoDB ObjectId"),

  body("itemsList.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  // Info Evening validation
  body("infoEvening.dateTime")
    .optional()
    .isISO8601()
    .withMessage("Info evening datetime must be a valid ISO8601 date"),

  body("infoEvening.location")
    .optional()
    .trim()
    .isString()
    .withMessage("Info evening location must be a string"),

  body("infoEvening.participants")
    .optional()
    .isArray()
    .withMessage("Info evening participants must be an array"),

  body("infoEvening.participants.*.email")
    .if(() => {
      // Only validate if participants array is provided
      return true;
    })
    .notEmpty()
    .withMessage("Participant email is required")
    .matches(emailRegex)
    .withMessage("Participant email must contain @ and a domain with ."),

  body("infoEvening.participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),

  // Trainings validation
  body("trainings")
    .optional()
    .isArray()
    .withMessage("Trainings must be an array"),

  body("trainings.*.number")
    .if((value, { req }) => {
      const trainings = req.body.trainings || [];
      return (
        trainings.length > 0 &&
        trainings[trainings.indexOf(value)] !== undefined
      );
    })
    .notEmpty()
    .withMessage("Training number is required")
    .isInt({ min: 1 })
    .withMessage("Training number must be a positive integer"),

  body("trainings.*.date")
    .optional()
    .isISO8601()
    .withMessage("Training date must be a valid ISO8601 date"),

  body("trainings.*.trainGoingTime")
    .optional()
    .isString()
    .withMessage("Train going time must be a string"),

  body("trainings.*.trainReturnTime")
    .optional()
    .isString()
    .withMessage("Train return time must be a string"),

  body("trainings.*.meetingTime")
    .optional()
    .isString()
    .withMessage("Meeting time must be a string"),

  body("trainings.*.meetingPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Meeting point must be a string"),

  body("trainings.*.returnTime")
    .optional()
    .isString()
    .withMessage("Return time must be a string"),

  body("trainings.*.distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("trainings.*.elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("trainings.*.elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("trainings.*.responsiblePerson")
    .optional()
    .isMongoId()
    .withMessage("Responsible person must be a valid MongoDB ObjectId"),

  body("trainings.*.itemsList")
    .optional()
    .isArray()
    .withMessage("Training items list must be an array"),

  body("trainings.*.itemsList.*.itemId")
    .optional()
    .isMongoId()
    .withMessage("Item ID must be a valid MongoDB ObjectId"),

  body("trainings.*.itemsList.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("trainings.*.remark")
    .optional()
    .trim()
    .isString()
    .withMessage("Remark must be a string"),

  // Fundraisings validation
  body("fundraisings")
    .optional()
    .isArray()
    .withMessage("Fundraisings must be an array"),

  body("fundraisings.*.number")
    .if((value, { req }) => {
      const fundraisings = req.body.fundraisings || [];
      return fundraisings.length > 0;
    })
    .notEmpty()
    .withMessage("Fundraising number is required")
    .isInt({ min: 1 })
    .withMessage("Fundraising number must be a positive integer"),

  body("fundraisings.*.dateTime")
    .optional()
    .isISO8601()
    .withMessage("Fundraising datetime must be a valid ISO8601 date"),

  body("fundraisings.*.location")
    .optional()
    .trim()
    .isString()
    .withMessage("Fundraising location must be a string"),

  body("fundraisings.*.participants")
    .optional()
    .isArray()
    .withMessage("Fundraising participants must be an array"),

  body("fundraisings.*.participants.*")
    .optional()
    .isMongoId()
    .withMessage("Participant must be a valid MongoDB ObjectId"),

  // General Meeting validation
  body("generalMeeting.dateTime")
    .optional()
    .isISO8601()
    .withMessage("General meeting datetime must be a valid ISO8601 date"),

  body("generalMeeting.location")
    .optional()
    .trim()
    .isString()
    .withMessage("General meeting location must be a string"),

  body("generalMeeting.participants")
    .optional()
    .isArray()
    .withMessage("General meeting participants must be an array"),

  body("generalMeeting.participants.*.email")
    .if(() => true)
    .notEmpty()
    .withMessage("Participant email is required")
    .matches(emailRegex)
    .withMessage("Participant email must contain @ and a domain with ."),

  body("generalMeeting.participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),

  // Stages validation
  body("stages").optional().isArray().withMessage("Stages must be an array"),

  body("stages.*.number")
    .if((value, { req }) => {
      const stages = req.body.stages || [];
      return stages.length > 0;
    })
    .notEmpty()
    .withMessage("Stage number is required")
    .isInt({ min: 1 })
    .withMessage("Stage number must be a positive integer"),

  body("stages.*.date")
    .optional()
    .isISO8601()
    .withMessage("Stage date must be a valid ISO8601 date"),

  body("stages.*.startPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Start point must be a string"),

  body("stages.*.endPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("End point must be a string"),

  body("stages.*.distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("stages.*.elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("stages.*.elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("stages.*.routeDescription")
    .optional()
    .trim()
    .isString()
    .withMessage("Route description must be a string"),
];

export const validateUpdateCamp = [
  ...validateIdParam,
  // Same validations as create, but all optional
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.startDate &&
        new Date(value) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("subStartDatetime")
    .optional()
    .isISO8601()
    .withMessage("Subscription start datetime must be a valid ISO8601 date"),

  body("subEndDatetime")
    .optional()
    .isISO8601()
    .withMessage("Subscription end datetime must be a valid ISO8601 date"),

  body("gpsTrack")
    .optional()
    .isObject()
    .withMessage("GPS track must be an object"),

  body("itemsList")
    .optional()
    .isArray()
    .withMessage("Items list must be an array"),

  body("itemsList.*.item")
    .optional()
    .isMongoId()
    .withMessage("Item reference must be a valid MongoDB ObjectId"),

  body("itemsList.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("infoEvening.dateTime")
    .optional()
    .isISO8601()
    .withMessage("Info evening datetime must be a valid ISO8601 date"),

  body("infoEvening.location")
    .optional()
    .trim()
    .isString()
    .withMessage("Info evening location must be a string"),

  body("infoEvening.participants")
    .optional()
    .isArray()
    .withMessage("Info evening participants must be an array"),

  body("infoEvening.participants.*.email")
    .if(() => true)
    .notEmpty()
    .withMessage("Participant email is required")
    .matches(emailRegex)
    .withMessage("Participant email must contain @ and a domain with ."),

  body("infoEvening.participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),

  body("trainings")
    .optional()
    .isArray()
    .withMessage("Trainings must be an array"),

  body("trainings.*.number")
    .if((value, { req }) => {
      const trainings = req.body.trainings || [];
      return trainings.length > 0;
    })
    .notEmpty()
    .withMessage("Training number is required")
    .isInt({ min: 1 })
    .withMessage("Training number must be a positive integer"),

  body("trainings.*.date")
    .optional()
    .isISO8601()
    .withMessage("Training date must be a valid ISO8601 date"),

  body("trainings.*.trainGoingTime")
    .optional()
    .isString()
    .withMessage("Train going time must be a string"),

  body("trainings.*.trainReturnTime")
    .optional()
    .isString()
    .withMessage("Train return time must be a string"),

  body("trainings.*.meetingTime")
    .optional()
    .isString()
    .withMessage("Meeting time must be a string"),

  body("trainings.*.meetingPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Meeting point must be a string"),

  body("trainings.*.returnTime")
    .optional()
    .isString()
    .withMessage("Return time must be a string"),

  body("trainings.*.distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("trainings.*.elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("trainings.*.elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("trainings.*.responsiblePerson")
    .optional()
    .isMongoId()
    .withMessage("Responsible person must be a valid MongoDB ObjectId"),

  body("trainings.*.itemsList")
    .optional()
    .isArray()
    .withMessage("Training items list must be an array"),

  body("trainings.*.itemsList.*.itemId")
    .optional()
    .isMongoId()
    .withMessage("Item ID must be a valid MongoDB ObjectId"),

  body("trainings.*.itemsList.*.quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  body("trainings.*.remark")
    .optional()
    .trim()
    .isString()
    .withMessage("Remark must be a string"),

  body("fundraisings")
    .optional()
    .isArray()
    .withMessage("Fundraisings must be an array"),

  body("fundraisings.*.number")
    .if((value, { req }) => {
      const fundraisings = req.body.fundraisings || [];
      return fundraisings.length > 0;
    })
    .notEmpty()
    .withMessage("Fundraising number is required")
    .isInt({ min: 1 })
    .withMessage("Fundraising number must be a positive integer"),

  body("fundraisings.*.dateTime")
    .optional()
    .isISO8601()
    .withMessage("Fundraising datetime must be a valid ISO8601 date"),

  body("fundraisings.*.location")
    .optional()
    .trim()
    .isString()
    .withMessage("Fundraising location must be a string"),

  body("fundraisings.*.participants")
    .optional()
    .isArray()
    .withMessage("Fundraising participants must be an array"),

  body("fundraisings.*.participants.*")
    .optional()
    .isMongoId()
    .withMessage("Participant must be a valid MongoDB ObjectId"),

  body("generalMeeting.dateTime")
    .optional()
    .isISO8601()
    .withMessage("General meeting datetime must be a valid ISO8601 date"),

  body("generalMeeting.location")
    .optional()
    .trim()
    .isString()
    .withMessage("General meeting location must be a string"),

  body("generalMeeting.participants")
    .optional()
    .isArray()
    .withMessage("General meeting participants must be an array"),

  body("generalMeeting.participants.*.email")
    .if(() => true)
    .notEmpty()
    .withMessage("Participant email is required")
    .matches(emailRegex)
    .withMessage("Participant email must contain @ and a domain with ."),

  body("generalMeeting.participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),

  body("stages").optional().isArray().withMessage("Stages must be an array"),

  body("stages.*.number")
    .if((value, { req }) => {
      const stages = req.body.stages || [];
      return stages.length > 0;
    })
    .notEmpty()
    .withMessage("Stage number is required")
    .isInt({ min: 1 })
    .withMessage("Stage number must be a positive integer"),

  body("stages.*.date")
    .optional()
    .isISO8601()
    .withMessage("Stage date must be a valid ISO8601 date"),

  body("stages.*.startPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Start point must be a string"),

  body("stages.*.endPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("End point must be a string"),

  body("stages.*.distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("stages.*.elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("stages.*.elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("stages.*.routeDescription")
    .optional()
    .trim()
    .isString()
    .withMessage("Route description must be a string"),
];
