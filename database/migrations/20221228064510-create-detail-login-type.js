module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DetailLoginTypes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.STRING,
      },
    });
  },
  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable("DetailLoginTypes");
  },
};
