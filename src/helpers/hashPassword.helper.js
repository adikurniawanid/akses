const bcrypt = require("bcrypt");
const config = require("../config/bcrypt.config");

module.exports = async (passwordParam) =>
  bcrypt.hash(passwordParam, Number(config.BCRYPT_ROUNDS));
