const jwt = require("jsonwebtoken");
const config = require("../config/jwt.config");
const { User, UserToken } = require("../models");

module.exports = async (payload) => {
  const user = await User.findOne({
    attributes: ["id"],
    where: { publicId: payload.publicId },
  });

  const accessToken = jwt.sign(payload, config.JWT_SECRET_KEY, {
    expiresIn: config.JWT_EXPIRATION * 60 * 60,
  });

  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET_KEY, {
    expiresIn: config.JWT_REFRESH_EXPIRATION * 24 * 60 * 60,
  });

  const userToken = await UserToken.findOne({
    attributes: ["refreshToken"],
    where: { userId: user.id },
  });

  if (userToken) {
    await UserToken.update({ refreshToken }, { where: { userId: user.id } });
  } else {
    await UserToken.create({ userId: user.id, refreshToken });
  }

  return { accessToken, refreshToken };
};
