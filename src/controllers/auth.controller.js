const { sequelize, User, UserBiodata } = require("../models");
const { hashPassword, generateJWT } = require("../helpers");

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
    res.json("ok");
  }

  static async logout(req, res, next) {
    res.json("ok");
  }

  static async loginWithGoogle(req, res, next) {
    res.json("ok");
  }

  static async loginWithFacebook(req, res, next) {
    res.json("ok");
  }
}

module.exports = AuthController;
