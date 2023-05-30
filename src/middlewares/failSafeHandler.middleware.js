/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = (err, _req, res, _next) => {
  res.status(500).json({ message: 'Internal server error' });
};
