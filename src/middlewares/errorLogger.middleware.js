/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
module.exports = (err, _req, _res, next) => {
  // eslint-disable-next-line no-console
  console.error(
    "\x1b[31m##### ERROR LOGGER #####\n\n",
    err instanceof Error ? err.stack : JSON.stringify(err, null, 2),
    "\n\n##### END ERROR LOGGER #####"
  );
  next(err);
};
