const jwt = require("jsonwebtoken");
const { User } = require("../models");
const JWTConfig = require("../config/jwt.config");

const { TokenExpiredError } = jwt;

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      next({
        status: 403,
        message: "No Authorization token provided!",
      });
    }

    const decoded = jwt.verify(token, JWTConfig.JWT_SECRET_KEY);

    const { publicId, email } = decoded;
    const selectedUser = await User.findOne({
      attributes: ["id"],
      where: {
        publicId,
        email,
      },
    });

    if (!selectedUser) {
      next({
        status: 401,
        message: { en: "Unauthorized User", id: "Pengguna tidak diizinkan" },
      });
    }

    req.user = selectedUser;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        message: "Unauthorized! Access Token was expired!",
      });
    }

    next(error);
  }
};
