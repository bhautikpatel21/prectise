const jwt = require("jsonwebtoken");
const { sendResponse, messages, } = require("../helpers/handleResponse");
const User = require("../model/user.model");
const userService = require("../service/dbService")({
    model: User,
});

const authToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return sendResponse(
            res,
            null,
            401,
            messages.unAuthorizedRequest("Please login again.")
        );
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                if (req.originalUrl.endsWith("/register/sendOtp") || req.originalUrl.endsWith("/register/resend-otp")) {
                    return sendResponse(res, null, 401, messages.unAuthorizedRequest("Expired send OTP link."));
                } else if (req.originalUrl.endsWith("/register/verifyOtp")) {
                    return sendResponse(res, null, 401, messages.unAuthorizedRequest("Expired verify OTP link."));
                }
                return sendResponse(res, null, 401, messages.unAuthorizedRequest("Please login again."));
            }
            return sendResponse(res, null, 401, messages.unAuthorizedRequest("Invalid credentials."));
        }

        const getUser = await userService.getSingleDocumentByQuery({ _id: decoded.id });
        if (!getUser) {
            return sendResponse(res, null, 401, messages.unAuthorizedRequest("Invalid credentials."));
        }

        req.user = getUser;

        if (decoded.purpose === "verify_email") {
            if (req.originalUrl.endsWith("/register/resend-otp")) {
                if (!getUser.isVerified) {
                    return next();
                }
                return sendResponse(res, null, 401, messages.unAuthorizedRequest("Email already verified."));
            }
            if (req.originalUrl.endsWith("/register/verifyOtp")) {
                if (!getUser.isVerified) {
                    return next();
                }
                return sendResponse(res, null, 401, messages.unAuthorizedRequest("Email already verified."));
            }
            if (req.originalUrl.endsWith("/forgetPassword/sendResetLink")) {
                return next();
            }
            if (req.originalUrl.endsWith("/forgetPassword/updatePassword")) {
                return next();
            }
            return sendResponse(res, null, 401, messages.unAuthorizedRequest("This token can only be used for sending or verifying OTP."));
        }

        // if (getUser.status !== 1 || !getUser.isVerified) {
        //     return sendResponse(res, null, 401, messages.unAuthorizedRequest("User is not active or verified."));
        // }

        if (getUser.password !== decoded.key) {
            return sendResponse(res, null, 401, messages.unAuthorizedRequest("Please login again."));
        }

        next();
    });
};

const authResetToken = async (req, res, next) => {

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return sendResponse(res, null, 401, messages.unAuthorizedRequest("Reset token required."));
    }

    const user = await userService.getSingleDocumentByQuery({ resetToken: token });

    if (!user) {
        return sendResponse(res, null, 401, messages.unAuthorizedRequest("Invalid or expired reset token."));
    }

    req.user = user;

    if (!req.originalUrl.endsWith("/forgetPassword/verify-forget-password-otp") && !req.originalUrl.endsWith("/forgetPassword/updatePassword") && !req.originalUrl.endsWith("/forgetPassword/resend-otp")) {
        return sendResponse(res, null, 401, messages.unAuthorizedRequest("This reset token can only be used for verifying OTP, resending OTP, or updating password."));
    }

    next();
};

module.exports = { authToken, authResetToken };
