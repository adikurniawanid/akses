/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      "DetailLoginTypes",
      [
        {
          id: "0",
          description: "unverified",
        },
        {
          id: "1",
          description: "akses",
        },
        {
          id: "2",
          description: "Google",
        },
        {
          id: "3",
          description: "Facebook",
        },
      ],
      {}
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete("DetailLoginTypes", null, {});
  },
};
