const { body } = require("express-validator");

const updateUserValidationRules = () => {
  return [
    body("name").optional().notEmpty().withMessage("name is required"),
    body("phone")
      .optional()
      .bail()
      .notEmpty()
      .withMessage("handphone is required")
      .isNumeric()
      .withMessage("handphone must be numbers"),
    body("avatarUrl")
      .optional()
      .bail()
      .notEmpty()
      .withMessage("avatarUrl is required"),
  ];
};

const updatePasswordValidationRules = () => [
  body("oldPassword")
    .notEmpty()
    .bail()
    .withMessage("Old password is required")
    .isLength({ min: 8, max: 21 })
    .withMessage("Old password must between 8 - 21 characters"),
  body("verificationPassword")
    .notEmpty()
    .bail()
    .withMessage("Verification password is required")
    .isLength({ min: 8, max: 21 })
    .withMessage("Verification password must between 8 - 21 characters"),
  body("newPassword")
    .notEmpty()
    .bail()
    .withMessage("New password is required")
    .isLength({ min: 8, max: 21 })
    .withMessage("New password must between 8 - 21 characters"),
  body("verificationPassword")
    .notEmpty()
    .withMessage("Verification password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(
          "Password confirmation does not match with new password"
        );
      }
      return true;
    }),
];

module.exports = {
  updateUserValidationRules,
  updatePasswordValidationRules,
};
