const { body, param } = require("express-validator");
const { User } = require("../models");

const registerValidationRules = () => [
  body("email")
    .notEmpty()
    .bail()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid")
    .custom(async (email) => {
      if (
        await User.findOne({
          where: {
            email,
          },
        })
      ) {
        throw new Error("Email already in use");
      }
    }),
  body("username")
    .notEmpty()
    .bail()
    .withMessage("Username is required")
    .custom(async (username) => {
      if (
        await User.findOne({
          where: {
            username,
          },
        })
      ) {
        throw new Error("Username already in use");
      }
    }),
  body("password")
    .notEmpty()
    .bail()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 21 })
    .withMessage("Password must between 8 - 21 characters"),
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ max: 255 })
    .withMessage("name must be less than 255 characters"),
];

const loginValidationRules = () => [
  body("email")
    .notEmpty()
    .bail()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  body("password")
    .notEmpty()
    .bail()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 21 })
    .withMessage("Password must between 8 - 21 characters"),
];

const logoutValidationRules = () => [
  body("publicId").notEmpty().withMessage("Public ID is required"),
];

const verifyEmailValidationRules = () => [
  body("email").notEmpty().withMessage("Email is required"),
];

const refreshTokenValidationRules = () => [
  body("refreshToken")
    .notEmpty()
    .bail()
    .withMessage("Refresh Token is required")
    .isJWT()
    .withMessage("Refresh Token is not valid"),
];

const loginWithGoogleValidationRules = () => [
  body("googleIdToken")
    .notEmpty()
    .bail()
    .withMessage("Google Id Token is required"),
];

const loginWithFacebookValidationRules = () => [
  body("facebookIdToken")
    .notEmpty()
    .bail()
    .withMessage("Facebook Id Token is required"),
];

const forgotPasswordValidationRules = () => [
  body("email")
    .notEmpty()
    .bail()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
];

const verifyforgotPasswordTokenValidationRules = () => [
  body("token").notEmpty().bail().withMessage("Token is required"),
  body("email")
    .notEmpty()
    .bail()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
];

const changeForgotPasswordValidationRules = () => [
  body("token").notEmpty().withMessage("Token is required"),
  body("email")
    .notEmpty()
    .bail()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
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
    })
    .isLength({ min: 8, max: 21 })
    .withMessage("Verification password must between 8 - 21 characters"),
];

module.exports = {
  registerValidationRules,
  loginValidationRules,
  logoutValidationRules,
  refreshTokenValidationRules,
  forgotPasswordValidationRules,
  verifyforgotPasswordTokenValidationRules,
  changeForgotPasswordValidationRules,
  loginWithGoogleValidationRules,
  loginWithFacebookValidationRules,
  verifyEmailValidationRules,
};
