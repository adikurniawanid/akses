const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserToken extends Model {
    static associate(models) {
      UserToken.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  UserToken.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
      },
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verificationEmailToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      verificationEmailTokenExpiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      forgotPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      forgotPasswordTokenExpiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserToken",
      timestamps: false,
    }
  );
  return UserToken;
};
