const nodemailer = require("nodemailer");
const config = require("../config/nodemailer.config");

module.exports = async (from, to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_HOST,
    secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: config.EMAIL_AUTH_USER,
      pass: config.EMAIL_AUTH_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return info;
};
