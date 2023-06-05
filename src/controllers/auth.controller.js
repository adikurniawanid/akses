const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const { sequelize, User, UserBiodata, UserToken } = require("../models");
const {
  hashPassword,
  generateJWT,
  verifyRefreshToken,
  generateRandomUsername,
} = require("../helpers");
const config = require("../config/googleOAuth.config");
const googleOAuthClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
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
        where: { email, loginTypeId: 0 },
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
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { userPublicId } = req.body;

      const user = await User.findOne({ publicId: userPublicId });

      if (!user) {
        next({
          status: 404,
          message: "user not found",
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

      res.status(200).json({
        message: "Access token created successfully",
        token: accessToken.refreshToken,
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
            loginTypeId: 1,
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
    res.json("ok");
  }
}

module.exports = AuthController;
