const express = require("express");
const { AuthController } = require("../controllers");
const { validation } = require("../middlewares");
const { authValidation } = require("../validations");
const router = express.Router();

router.post(
  "/register",
  authValidation.registerValidationRules(),
  validation,
  AuthController.register
);

router.post(
  "/login",
  authValidation.loginValidationRules(),
  validation,
  AuthController.login
);

router.post(
  "/logout",
  authValidation.logoutValidationRules(),
  validation,
  AuthController.logout
);

router.post(
  "/refresh-token",
  authValidation.refreshTokenValidationRules(),
  validation,
  AuthController.refreshToken
);

module.exports = router;
