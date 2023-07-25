const express = require("express");
const { UserController } = require("../controllers");
const { validation } = require("../../../middlewares");
const { userValidation } = require("../../../validations");
const { authorization } = require("../../../middlewares");
const router = express.Router();

router.post(
  "/change-password",
  authorization,
  userValidation.updatePasswordValidationRules(),
  validation,
  UserController.updatePassword
);

module.exports = router;
