/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      'DetailLoginTypes',
      [
        {
          id: '0',
          description: 'app',
        },
        {
          id: '1',
          description: 'Google',
        },
      ],
      {},
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('DetailLoginTypes', null, {});
  },
};
