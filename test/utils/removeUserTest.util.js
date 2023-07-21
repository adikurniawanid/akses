const { sequelize, User, UserBiodata, UserToken } = require("../../src/models");

module.exports = async (usernameParam) => {
  const userTesting = await User.findOne({
    where: { username: usernameParam },
    attributes: ["id"],
  });

  if (await userTesting.id) {
    await UserToken.destroy({
      where: {
        userId: userTesting.id,
      },
    });

    await UserBiodata.destroy({
      where: {
        userId: userTesting.id,
      },
    });

    await User.destroy({
      where: {
        id: userTesting.id,
      },
      force: true,
    });
  }
};
