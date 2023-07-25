require("dotenv").config();

module.exports = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_HOST,
  secure: process.env.EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASSWORD,
  },
};
