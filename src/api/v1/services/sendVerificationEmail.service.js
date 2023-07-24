const crypto = require("crypto");
const { User, UserToken, UserBiodata } = require("../../../models");
const VERIFICATION_EMAIL_TOKEN_EXPIRATION =
  process.env.VERIFICATION_EMAIL_TOKEN_EXPIRATION;
const sendMail = require("../../../helpers/sendMail.helper");
const forgotPasswordMailTemplate = require("../../../../templates/emails/forgotPassword.email");

module.exports = async (idParam) => {
  try {
    const user = await User.findOne({
      attributes: ["email"],
      include: [
        {
          model: UserBiodata,
          attributes: ["name"],
        },
      ],
      where: {
        id: idParam,
      },
    });

    const isVerificationEmailTokenExpired = await UserToken.findOne({
      attributes: ["verificationEmailTokenExpiredAt"],
      where: {
        userId: idParam,
      },
    });

    if (isVerificationEmailTokenExpired) {
      if (
        isVerificationEmailTokenExpired.verificationEmailTokenExpiredAt <
        Date.now()
      ) {
        const token = crypto.randomBytes(128).toString("hex");

        await UserToken.update(
          {
            verificationEmailToken: token,
            verificationEmailTokenExpiredAt: new Date(
              Date.now() + VERIFICATION_EMAIL_TOKEN_EXPIRATION * 60000
            ),
          },
          {
            where: {
              userId: idParam,
            },
          }
        );

        await sendMail(
          "verificationEmail@akses.com",
          user.email,
          "Verification Email - akses",
          null,
          forgotPasswordMailTemplate(user.UserBiodatum.name, token)
        );

        return {
          status: "success",
          message: "Verification email has been sent",
        };
      }
    }

    return {
      status: "success",
      message: "Verification email still valid",
    };
  } catch (error) {
    throw error;
  }
};
