const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken, authResetToken } = require("../../middleware/auth.middleware");

const register = require("./register");
const login = require("./login");
const forgetPassword = require("./forgetPassword");

router.post(
    "/register",
    validator("body", register.rule),
    register.handler
);

router.post(
    "/login",
    validator("body", login.rule),
    login.handler
);

// Forget Password routes
router.post(
    "/forgetPassword/send-forget-password-otp",
    validator("body", forgetPassword.sendForgetPasswordOtp.rule),
    forgetPassword.sendForgetPasswordOtp
);

router.post(
    "/forgetPassword/verify-forget-password-otp",
    authResetToken,
    validator("body", forgetPassword.verifyForgetPasswordOtp.rule),
    forgetPassword.verifyForgetPasswordOtp
);

router.post(
    "/forgetPassword/updatePassword",
    authResetToken,
    validator("body", forgetPassword.updatePassword.rule),
    forgetPassword.updatePassword
);

module.exports = router;
