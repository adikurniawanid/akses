const bcrypt = require("bcrypt");
const { User, UserBiodata } = require("../../../models");
const { hashPasswordHelper } = require("../../../helpers");
const bcryptConfig = require("../../../config/bcrypt.config");

class UserController {
  static async detail(req, res, next) {
    try {
      const { id } = req.user;

      const user = await User.findOne({
        attributes: ["publicId", "username", "email"],
        include: {
          model: UserBiodata,
          attributes: ["name", "phone", "avatarUrl", "updatedAt"],
        },
        where: {
          id: id,
        },
      });

      console.log(user);

      if (!user) {
        throw {
          status: 404,
          message: "User not found",
        };
      }

      const data = {
        publicId: user.publicId,
        username: user.username,
        email: user.email,
        name: user.UserBiodatum.name,
        phone: user.UserBiodatum.phone,
        avatarUrl: user.UserBiodatum.avatarUrl,
        updatedAt: user.UserBiodatum.updatedAt,
      };

      res.status(200).json({
        message: "Success get user detail",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.user;

      const { name, phone, avatarUrl } = req.body;

      const user = await User.findOne({
        where: {
          id,
        },
      });

      if (!user) {
        throw {
          status: 404,
          message: "User not found",
        };
      }

      await UserBiodata.update(
        {
          name,
          phone,
          avatarUrl,
        },
        {
          where: {
            userId: id,
          },
        }
      );

      res.status(200).json({
        message: "Success update user detail",
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req, res, next) {
    try {
      const { id } = req.user;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findOne({
        attributes: ["password", "salt"],
        where: {
          id,
        },
      });

      if (!user) {
        throw {
          status: 404,
          message: "User not found",
        };
      }

      const isPasswordValid = await bcrypt.compare(
        oldPassword + user.salt + bcryptConfig.PEPPER,
        user.password
      );

      if (!isPasswordValid) {
        throw {
          status: 401,
          message: "Old password is not valid",
        };
      }

      const salt = bcrypt.genSaltSync(bcryptConfig.BCRYPT_ROUNDS);

      await User.update(
        {
          password: await hashPasswordHelper(
            newPassword + salt + bcryptConfig.PEPPER
          ),
          salt,
        },
        {
          where: {
            id,
          },
        }
      );

      res.status(200).json({
        message: "Success change password",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
