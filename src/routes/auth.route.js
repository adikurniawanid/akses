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
router.get("/logout", AuthController.login);

module.exports = router;
