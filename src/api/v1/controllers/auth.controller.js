const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const { sequelize, User, UserBiodata, UserToken } = require("../../../models");
const {
  hashPassword,
  generateJWT,
  verifyRefreshToken,
  generateRandomUsername,
} = require("../../../helpers");
const config = require("../../../config/googleOAuth.config");
const axios = require("axios");
const googleOAuthClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
);
const sendMail = require("../../../helpers/sendMail.helper");
const forgotPasswordMailTemplate = require("../../../../templates/emails/forgotPassword.email");
const sendVerificationEmailService = require("../services/sendVerificationEmail.service");
const FORGOT_PASSWORD_TOKEN_EXPIRATION =
  process.env.FORGOT_PASSWORD_TOKEN_EXPIRATION;
class AuthController {
  static async register(req, res, next) {
    const transaction = await sequelize.transaction();

    try {
      const { name, username, email, password } = req.body;

      const user = await User.create(
        {
          email,
          username,
          password: await hashPassword(password),
        },
        { transaction }
      );

      const userBiodata = await UserBiodata.create(
        { userId: user.id, name },
        { transaction }
      );
      await transaction.commit();

      const token = await generateJWT(user.id, user.publicId, user.email);

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
          token: await generateJWT(user.id, user.publicId, user.email),
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

      const sendVerificationEmail = await sendVerificationEmailService(email);
      if (sendVerificationEmail.status === "success") {
        res.status(200).json({
          message: sendVerificationEmail.message,
        });
      }
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
      const tokenDetails = await verifyRefreshToken(refreshToken);

      if (!tokenDetails) {
        next({
          status: 400,
          message: "Invalid refresh token",
        });
      }

      const accessToken = await generateJWT(
        tokenDetails.userId,
        tokenDetails.publicId,
        tokenDetails.email
      );

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
        audience: config.GOOGLE_CLIENT_IDs,
      });

      const payload = verifyToken.getPayload();

      const user = await User.findOne({
        where: {
          publicId: payload.sub,
        },
        include: {
          model: UserBiodata,
          attributes: ["name", "avatarUrl"],
        },
      });

      if (!user) {
        const newUser = await User.create(
          {
            email: payload.email,
            password: await hashPassword(payload.sub),
            publicId: payload.sub,
            username: generateRandomUsername(),
            loginTypeId: 2,
          },
          { transaction }
        );

        const newUserBiodata = await UserBiodata.create(
          {
            userId: newUser.id,
            name: payload.name,
            avatarUrl: payload.picture,
          },
          { transaction }
        );

        await transaction.commit();
        const token = await generateJWT(
          newUser.id,
          newUser.publicId,
          newUser.email
        );

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
          name: payload.name,
          avatarUrl: payload.picture,
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      res.status(200).json({
        message: "Login sucessfully",
        data: {
          publicId: user.publicId,
          name: user.UserBiodatum.name,
          username: user.username,
          avatarUrl: user.UserBiodatum.avatarUrl,
        },
        token: await generateJWT(user.id, user.publicId, user.email),
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

      const payload = facebookLogin.data;

      const user = await User.findOne({
        where: {
          publicId: payload.id,
        },
        include: {
          model: UserBiodata,
          attributes: ["name", "avatarUrl"],
        },
      });

      if (!user) {
        const newUser = await User.create(
          {
            email: `${payload.id}@facebook.com`,
            password: await hashPassword(payload.id),
            publicId: payload.id,
            username: generateRandomUsername(),
            loginTypeId: 3,
          },
          { transaction }
        );

        const newUserBiodata = await UserBiodata.create(
          {
            userId: newUser.id,
            name: payload.name,
            avatarUrl: payload.picture.data.url,
          },
          { transaction }
        );

        await transaction.commit();
        const token = await generateJWT(
          newUser.id,
          newUser.publicId,
          newUser.email
        );

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
          name: payload.name,
          avatarUrl: payload.picture.data.url,
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      const token = await generateJWT(user.id, user.publicId, user.email);

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

      const otpHash = await hashPassword(otp);

      await UserToken.update(
        {
          forgotPasswordToken: otpHash,
          forgotPasswordTokenExpiredAt: new Date(
            Date.now() + FORGOT_PASSWORD_TOKEN_EXPIRATION * 60
          ),
        },
        {
          where: {
            userId: user.id,
          },
        }
      );

      await sendMail(
        "changePassword@akses.com",
        req.body.email,
        "Forgot Password - akses",
        null,
        forgotPasswordMailTemplate(user.UserBiodatum.name, otp)
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
          password: await hashPassword(newPassword),
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
