const nodemailer = require("nodemailer");
const nodemailerConfig = require("../config/nodemailer.config");

module.exports = async (from, to, subject, text, html) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return info;
};
