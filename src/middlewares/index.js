const errorHandler = require("./errorHandler.middleware");
const validation = require("./validation.middleware");
const errorLogger = require("./errorLogger.middleware");
const failSafeHandler = require("./failSafeHandler.middleware");

module.exports = {
  errorHandler,
  validation,
  errorLogger,
  failSafeHandler,
};
