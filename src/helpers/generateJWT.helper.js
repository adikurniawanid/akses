const jwt = require("jsonwebtoken");
const config = require("../config/jwt.config");
const { UserToken } = require("../models");

module.exports = async (userIdParam, publicIdParam, emailParam) => {
  const payload = {
    userId: userIdParam,
    publicId: publicIdParam,
    email: emailParam,
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET_KEY, {
    expiresIn: config.JWT_EXPIRATION * 60,
  });

  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET_KEY, {
    expiresIn: config.JWT_REFRESH_EXPIRATION * 60,
  });

  const userToken = await UserToken.findOne({
    attributes: ["refreshToken"],
    where: { userId: payload.userId },
  });

  if (userToken) {
    await UserToken.update(
      { refreshToken },
      { where: { userId: payload.userId } }
    );
  } else {
    await UserToken.create({ userId: payload.userId, refreshToken });
  }

  return { accessToken, refreshToken };
};
