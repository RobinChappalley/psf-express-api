import express from "express";
import createError from "http-errors";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import errorHandler from "./middlewares/errorHandler.js";
import loginLimiter from "./utils/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. On construit le chemin absolu vers le fichier
// Si openapi.yml est dans le MEME dossier que app.js :
const openApiPath = path.join(__dirname, "openapi.yml");

import pushRouter from "./routes/push.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import campsRouter from "./routes/camps.js";
import hikesRouter from "./routes/hikes.js";
import itemsRouter from "./routes/items.js";

const app = express();
// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync(openApiPath, "utf8"));
// Serve the Swagger UI documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(logger("dev"));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS;
console.log("Allowed Origins:", allowedOrigins);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/push", pushRouter);

if (process.env.NODE_ENV === "test") {
  app.use("/", authRouter);
} else {
  app.use("/", loginLimiter, authRouter);
}
app.use("/items", itemsRouter);
app.use("/users", usersRouter);
app.use("/camps", campsRouter);
app.use("/hikes", hikesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, "Route not found"));
});

// error handler
app.use(errorHandler);

export default app;
