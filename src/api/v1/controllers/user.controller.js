const bcrypt = require("bcrypt");
const { User } = require("../../../models");
const { hashPasswordHelper } = require("../../../helpers");

class UserController {
  static async updatePassword(req, res, next) {
    try {
      const { id } = req.user;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findOne({
        attributes: ["password"],
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

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        throw {
          status: 400,
          message: "Old password is not valid",
        };
      }

      await User.update(
        {
          password: await hashPasswordHelper(newPassword),
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
