/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserTokens", {
      userId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        unique: true,
      },
      refreshToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verificationEmailToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verificationEmailTokenExpiredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      forgotPasswordToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      forgotPasswordTokenExpiredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable("UserTokens");
  },
};
