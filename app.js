import express from "express";
import createError from "http-errors";
import logger from "morgan";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";

import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import campsRouter from "./routes/camps.js";

const app = express();
// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync("./openapi.yml"));
// Serve the Swagger UI documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/camps", campsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;

//commentaire
