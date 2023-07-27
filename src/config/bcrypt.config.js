require("dotenv").config();

module.exports = {
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS),
  PEPPER: process.env.PEPPER,
};
