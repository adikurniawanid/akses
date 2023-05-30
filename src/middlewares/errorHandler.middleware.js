/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = (err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ message: err.message });
  } else {
    next(err);
  }
};
