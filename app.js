const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const {
  errorHandler,
  errorLogger,
  failSafeHandler,
} = require("./src/middlewares");
const { authRouter } = require("./src/routes/");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRouter);
app.use(errorLogger);
app.use(errorHandler);
app.use(failSafeHandler);
module.exports = app;
