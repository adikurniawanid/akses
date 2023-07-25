const axios = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const googleOAuthconfig = require("../../../config/googleOAuth.config");
const tokenConfig = require("../../../config/token.config");
const { sequelize, User, UserBiodata, UserToken } = require("../../../models");
const {
  hashPasswordHelper,
  generateJWTHelper,
  verifyRefreshTokenHelper,
  generateRandomUsernameHelper,
  sendMailHelper,
} = require("../../../helpers");
const {
  forgotPasswordEmailTemplate,
  verifyEmailTemplate,
} = require("../../../../templates/emails");

const googleOAuthClient = new OAuth2Client(
  googleOAuthconfig.GOOGLE_CLIENT_ID,
  googleOAuthconfig.GOOGLE_CLIENT_SECRET
);

class AuthController {
  static async register(req, res, next) {
    const transaction = await sequelize.transaction();

    try {
      const { name, username, email, password } = req.body;

      const user = await User.create(
        {
          email,
          username,
          password: await hashPasswordHelper(password),
          loginTypeId: 1,
        },
        { transaction }
      );

      const userBiodata = await UserBiodata.create(
        { userId: user.id, name },
        { transaction }
      );
      await transaction.commit();

      const payload = {
        publicId: user.publicId,
        email: user.email,
      };

      const token = await generateJWTHelper(payload);

      res.status(201).json({
        message: "User created successfully",
        data: {
          publicId: user.publicId,
          name: userBiodata.name,
          username: user.username,
          avatarUrl: userBiodata.avatarUrl,
        },
        token,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        include: {
          model: UserBiodata,
          attributes: ["name", "avatarUrl"],
        },
        where: { email },
      });

      if (!user) {
        next({
          status: 401,
          message: "Invalid email or password",
        });
      }

      const verifiedPassword = await bcrypt.compare(password, user.password);

      if (!verifiedPassword) {
        next({
          status: 401,
          message: "Invalid email or password",
        });
      }

      const payload = {
        publicId: user.publicId,
        email: user.email,
      };

      const token = await generateJWTHelper(payload);

      if (user.loginTypeId === 0) {
        res.status(403).json({
          message: "Email not verified, please verify your email first",
        });
      } else if (user.loginTypeId === 1) {
        res.status(200).json({
          message: "Login sucessfully",
          data: {
            publicId: user.publicId,
            name: user.UserBiodatum.name,
            username: user.username,
            avatarUrl: user.UserBiodatum.avatarUrl,
          },
          token,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async requestVerifyEmail(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({
        attributes: ["id", "publicId"],
        include: [
          {
            model: UserBiodata,
            attributes: ["name"],
          },
        ],
        where: {
          email,
        },
      });

      if (!user) {
        throw {
          status: 404,
          message: "User not found",
        };
      }

      if (user.loginTypeId === 1) {
        throw {
          status: 400,
          message: "Email already verified",
        };
      }

      const verifyEmailToken = crypto.randomBytes(128).toString("hex");
      const hashedVerifyEmailToken = await hashPasswordHelper(verifyEmailToken);

      const verifyEmailURL = `${process.env.API_URL}/${process.env.API_VERSION}/verify-email/${verifyEmailToken}/${user.publicId}`;

      await UserToken.update(
        {
          verificationEmailToken: hashedVerifyEmailToken,
          verificationEmailTokenExpiredAt: new Date(
            Date.now() + tokenConfig.VERIFICATION_EMAIL_TOKEN_EXPIRATION * 60
          ),
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      await sendMailHelper(
        "verificationEmail@akses.com",
        email,
        "Verification Email - akses",
        null,
        verifyEmailTemplate(user.UserBiodatum.name, verifyEmailURL)
      );

      res.status(200).json({
        message: "Verification email has been sent",
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req, res, next) {
    const transaction = await sequelize.transaction();

    try {
      const { token, publicId } = req.params;

      const user = await User.findOne({
        attributes: ["id"],
        include: {
          model: UserToken,
          attributes: [
            "verificationEmailToken",
            "verificationEmailTokenExpiredAt",
          ],
        },
        where: { publicId },
      });

      if (!user) {
        throw {
          status: 404,
          message: "Invalid verification email token",
        };
      }

      if (user.UserToken.verificationEmailToken == null) {
        throw {
          status: 404,
          message: "Invalid verification email token",
        };
      }

      if (
        user.UserToken.verificationEmailTokenExpiredAt < new Date() &&
        user.UserToken.verificationEmailTokenExpiredAt !== null
      ) {
        throw {
          status: 422,
          message: "Token expired, please request a new token",
        };
      }

      if (bcrypt.compare(token, user.UserToken.verificationEmailToken)) {
        await User.update(
          {
            loginTypeId: 1,
          },
          {
            where: { id: user.id },
          },
          { transaction }
        );

        await UserToken.update(
          {
            verificationEmailToken: null,
            verificationEmailTokenExpiredAt: null,
          },
          {
            where: {
              userId: user.id,
            },
          },
          { transaction }
        );

        res.json({
          message: "Email verified successfully",
        });
      } else {
        throw {
          status: 422,
          message: "Token invalid, please check your token",
        };
      }
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { publicId } = req.body;

      const user = await User.findOne({ where: { publicId: publicId } });

      if (!user) {
        next({
          status: 404,
          message: "User not found",
        });
      }

      await UserToken.update(
        {
          refreshToken: null,
        },
        {
          where: { userId: user.id },
        }
      );

      res.status(200).json({
        message: "Logout successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokenDetails = await verifyRefreshTokenHelper(refreshToken);

      if (!tokenDetails) {
        next({
          status: 400,
          message: "Invalid refresh token",
        });
      }

      const payload = {
        userId: tokenDetails.userId,
        publicId: tokenDetails.publicId,
        email: tokenDetails.email,
      };

      const accessToken = await generateJWTHelper(payload);

      res.status(201).json({
        message: "Access token created successfully",
        token: {
          accessToken: accessToken.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async loginWithGoogle(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const verifyToken = await googleOAuthClient.verifyIdToken({
        idToken: req.body.googleIdToken,
        audience: googleOAuthconfig.GOOGLE_CLIENT_IDs,
      });

      const payloadGoogleOauth = verifyToken.getPayload();

      const user = await User.findOne({
        where: {
          publicId: payloadGoogleOauth.sub,
        },
        include: {
          model: UserBiodata,
          attributes: ["name", "avatarUrl"],
        },
      });

      if (!user) {
        const newUser = await User.create(
          {
            email: payloadGoogleOauth.email,
            password: await hashPasswordHelper(payloadGoogleOauth.sub),
            publicId: payloadGoogleOauth.sub,
            username: generateRandomUsernameHelper(),
            loginTypeId: 2,
          },
          { transaction }
        );

        const newUserBiodata = await UserBiodata.create(
          {
            userId: newUser.id,
            name: payloadGoogleOauth.name,
            avatarUrl: payloadGoogleOauth.picture,
          },
          { transaction }
        );

        await transaction.commit();
        const payload = {
          userId: newUser.id,
          publicId: newUser.publicId,
          email: newUser.email,
        };

        const token = await generateJWTHelper(payload);

        res.status(201).json({
          message: "User created successfully",
          data: {
            publicId: newUser.publicId,
            name: newUserBiodata.name,
            username: newUser.username,
            avatarUrl: newUserBiodata.avatarUrl,
          },
          token,
        });
        return;
      }

      await UserBiodata.update(
        {
          name: payloadGoogleOauth.name,
          avatarUrl: payloadGoogleOauth.picture,
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      const payload = {
        publicId: user.publicId,
        email: user.email,
      };

      const token = await generateJWTHelper(payload);

      res.status(200).json({
        message: "Login sucessfully",
        data: {
          publicId: user.publicId,
          name: user.UserBiodatum.name,
          username: user.username,
          avatarUrl: user.UserBiodatum.avatarUrl,
        },
        token,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  static async loginWithFacebook(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const facebookLogin = await axios.get(
        `https://graph.facebook.com/v17.0/me?fields=id,name,email,picture.width(640).height(640)&access_token=${req.body.facebookIdToken}`
      );

      const payloadFB = facebookLogin.data;

      const user = await User.findOne({
        where: {
          publicId: payloadFB.id,
        },
        include: {
          model: UserBiodata,
          attributes: ["name", "avatarUrl"],
        },
      });

      if (!user) {
        const newUser = await User.create(
          {
            email: `${payloadFB.id}@facebook.com`,
            password: await hashPasswordHelper(payloadFB.id),
            publicId: payloadFB.id,
            username: generateRandomUsernameHelper(),
            loginTypeId: 3,
          },
          { transaction }
        );

        const newUserBiodata = await UserBiodata.create(
          {
            userId: newUser.id,
            name: payloadFB.name,
            avatarUrl: payloadFB.picture.data.url,
          },
          { transaction }
        );

        await transaction.commit();
        const payload = {
          userId: newUser.id,
          publicId: newUser.publicId,
          email: newUser.email,
        };
        const token = await generateJWTHelper(payload);

        res.status(201).json({
          message: "User created successfully",
          data: {
            publicId: newUser.publicId,
            name: newUserBiodata.name,
            username: newUser.username,
            avatarUrl: newUserBiodata.avatarUrl,
          },
          token,
        });
        return;
      }

      await UserBiodata.update(
        {
          name: payloadFB.name,
          avatarUrl: payloadFB.picture.data.url,
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      const payload = {
        publicId: user.publicId,
        email: user.email,
      };
      const token = await generateJWTHelper(payload);

      res.status(200).json({
        message: "Login sucessfully",
        data: {
          publicId: user.publicId,
          name: user.UserBiodatum.name,
          username: user.username,
          avatarUrl: user.UserBiodatum.avatarUrl,
        },
        token,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({
        attributes: ["id", "email"],
        include: { model: UserBiodata, attributes: ["name"] },
        where: { email },
      });

      if (!user) {
        next({
          status: 404,
          message: "User not found",
        });
      }

      const otp = otpGenerator.generate(6, {
        upperCase: false,
        specialChars: false,
      });

      const otpHash = await hashPasswordHelper(otp);

      await UserToken.update(
        {
          forgotPasswordToken: otpHash,
          forgotPasswordTokenExpiredAt: new Date(
            Date.now() + tokenConfig.FORGOT_PASSWORD_TOKEN_EXPIRATION * 60
          ),
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      await sendMailHelper(
        "changePassword@akses.com",
        req.body.email,
        "Forgot Password - akses",
        null,
        forgotPasswordEmailTemplate(user.UserBiodatum.name, otp)
      );

      res.status(200).json({
        message: "Success send forgot password token",
      });
    } catch (error) {
      next(error);
    }
  }

  static async changeForgotPassword(req, res, next) {
    try {
      const { email, token, newPassword } = req.body;

      const user = await User.findOne({
        attributes: ["id"],
        include: {
          model: UserToken,
          attributes: ["forgotPasswordToken", "forgotPasswordTokenExpiredAt"],
        },
        where: { email },
      });

      if (!user) {
        next({
          status: 404,
          message: "User not found",
        });
      }

      if (
        user.UserToken.forgotPasswordTokenExpiredAt < new Date() &&
        user.UserToken.forgotPasswordTokenExpiredAt !== null
      ) {
        next({
          status: 422,
          message: "Token expired, please request a new token",
        });
      }

      const isTokenValid = await bcrypt.compare(
        token,
        user.UserToken.forgotPasswordToken
      );

      if (!isTokenValid) {
        next({
          status: 422,
          message: "Token invalid, please check your token",
        });
      }

      await User.update(
        {
          password: await hashPasswordHelper(newPassword),
        },
        {
          where: {
            id: user.id,
          },
        }
      );

      await UserToken.update(
        {
          forgotPasswordToken: null,
          forgotPasswordTokenExpiredAt: null,
          refreshToken: null,
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
