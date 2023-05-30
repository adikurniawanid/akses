const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DetailLoginType extends Model {
    static associate(models) {
      DetailLoginType.hasOne(models.User, {
        foreignKey: 'loginTypeId',
      });
    }
  }
  DetailLoginType.init(
    {
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'DetailLoginType',
      tableName: 'DetailLoginTypes',
      timestamps: false,
    },
  );
  return DetailLoginType;
};
