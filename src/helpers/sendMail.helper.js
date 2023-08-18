const nodemailer = require("nodemailer");
const nodemailerConfig = require("../config/nodemailer.config");

module.exports = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);

  const info = await transporter.sendMail({
    from: process.env.EMAIL_AUTH_USER,
    to,
    subject,
    text,
    html,
  });
  return info;
};
