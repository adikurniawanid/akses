const express = require("express");
const { AuthController } = require("../controllers");
const router = express.Router();

router.post("/register", AuthController.register);
router.get("/login", AuthController.login);
router.get("/logout", AuthController.login);

module.exports = router;
