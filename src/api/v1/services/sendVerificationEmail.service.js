const crypto = require("crypto");
const { User, UserToken, UserBiodata } = require("../../../models");
const VERIFICATION_EMAIL_TOKEN_EXPIRATION =
  process.env.VERIFICATION_EMAIL_TOKEN_EXPIRATION;
const sendMail = require("../../../helpers/sendMail.helper");
const verifyEmailMailTemplate = require("../../../../templates/emails/verifyEmail.email");
const hashPasswordHelper = require("../../../helpers/hashPassword.helper");

module.exports = async (emailParam) => {
  try {
    const user = await User.findOne({
      attributes: ["id", "publicId"],
      include: [
        {
          model: UserBiodata,
          attributes: ["name"],
        },
      ],
      where: {
        email: emailParam,
      },
    });

    const VerifyEmailToken = crypto.randomBytes(128).toString("hex");
    const hashedVerifyEmailToken = await hashPasswordHelper(VerifyEmailToken);

    const verifyEmailURL = `${process.env.API_URL}/${process.env.API_VERSION}/verify-email/${VerifyEmailToken}/${user.publicId}`;

    await UserToken.update(
      {
        verificationEmailToken: hashedVerifyEmailToken,
        verificationEmailTokenExpiredAt: new Date(
          Date.now() + VERIFICATION_EMAIL_TOKEN_EXPIRATION * 60
        ),
      },
      {
        where: {
          userId: user.id,
        },
      }
    );

    await sendMail(
      "verificationEmail@akses.com",
      emailParam,
      "Verification Email - akses",
      null,
      verifyEmailMailTemplate(user.UserBiodatum.name, verifyEmailURL)
    );

    return {
      status: "success",
      message: "Verification email has been sent",
    };
  } catch (error) {
    throw error;
  }
};
