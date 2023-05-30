const bcrypt = require("bcrypt");
const { sequelize, User, UserBiodata, UserToken } = require("../models");
const { hashPassword, generateJWT, verifyRefreshToken } = require("../helpers");

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

      await UserBiodata.create({ userId: user.id, name }, { transaction });
      await transaction.commit();

      const token = await generateJWT(user.id, user.publicId, user.email);

      res.status(201).json({
        message: "User created successfully",
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
        include: { model: UserBiodata, attributes: ["name"] },
        where: { email, loginTypeId: 0 },
      });

      if (!user) {
        next({
          status: 401,
          message: {
            en: "Invalid email or password",
            id: "Email atau password salah",
          },
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
    res.json("ok");
  }

  static async loginWithFacebook(req, res, next) {
    res.json("ok");
  }
}

module.exports = AuthController;
