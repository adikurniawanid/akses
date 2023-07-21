require("dotenv").config();

module.exports = {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_AUTH_USER: process.env.EMAIL_AUTH_USER,
  EMAIL_AUTH_PASSWORD: process.env.EMAIL_AUTH_PASSWORD,
};
