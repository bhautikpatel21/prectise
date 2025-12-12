const Joi = require("joi");
const crypto = require("crypto");
const User = require("../../../model/user.model");
const { sendEmail } = require("../../../helpers/email");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const userService = require("../../../service/dbService")({
    model: User
});
const { hash } = require("../../../helpers/hash");

// Helper to generate random token
const generateToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// Helper to generate OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.sendForgetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userService.getSingleDocumentByQuery({ email });

        if (!user) {
            return sendResponse(res, null, 404, messages.badRequest("User not found with the provided email."));
        }

        // Check if user is blocked from sending reset OTP
        if (user.resetOtpSendBlockedUntil && user.resetOtpSendBlockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.resetOtpSendBlockedUntil - new Date()) / 60000); // minutes
            return sendResponse(res, null, 429, messages.badRequest(`Too many wrong attempts. Try again after ${remainingTime} minutes.`));
        }

        // Check send attempts
        if (user.resetOtpSendAttempts >= 4) {
            // Block for 5 minutes
            await userService.updateDocumentById(user._id, {
                resetOtpSendBlockedUntil: new Date(Date.now() + 300000), // 5 minutes
                resetOtpSendAttempts: 0 // Reset attempts after block
            });
            return sendResponse(res, null, 429, messages.badRequest(`Too many wrong attempts. Try again after 5 minutes.`));
        }

        // Generate reset token and OTP
        const resetToken = generateToken();
        const resetOtp = generateOtp();
        const resetOtpExpiresAt = new Date(Date.now() + 300000); // 5 minutes validity
        const newSendAttempts = (user.resetOtpSendAttempts || 0) + 1;
        await userService.updateDocumentById(user._id, { resetToken, resetOtp, resetOtpExpiresAt, resetOtpSendAttempts: newSendAttempts });

        // Email subject
        const subject = "🔐 Reset Your Password OTP - The Sea Horse";

        // HTML email body with OTP
        const html = `
            <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px; text-align: center;">
                <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Password Reset OTP</h2>
                    <p style="color: #555;">Hello ${user.name || "User"},</p>
                    <p style="color: #555;">
                        We received a request to reset your password for your <strong>The Sea Horse</strong> account.
                        Use the OTP below to reset your password:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 5px; margin: 20px 0;">
                        ${resetOtp}
                    </div>
                    <p style="color: #777; font-size: 14px;">
                        This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
                    </p>
                    <p style="margin-top: 30px; color: #999; font-size: 13px;">
                        If you didn’t request this, please ignore this email.
                    </p>
                </div>
            </div>
        `;

        // Send email using HTML
        const emailResult = await sendEmail(user.email, subject, "", html);

        if (!emailResult.success) {
            return sendResponse(res, null, 500, messages.internalServerError("Failed to send reset OTP email."));
        }

        return sendResponse(res, null, 200, messages.successResponse("Reset OTP sent to your email.", { token: resetToken }));
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.sendForgetPasswordOtp.rule = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "email must be a valid email",
        "string.empty": "email is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

// 4. Update Password
exports.verifyForgetPasswordOtp = async (req, res) => {
    const { otp } = req.body;
    try {
        const user = req.user;

        if (!user.resetOtp) {
            return sendResponse(res, null, 400, messages.badRequest("Reset password OTP already verified."));
        }

        // Check if user is blocked
        if (user.resetOtpBlockedUntil && user.resetOtpBlockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.resetOtpBlockedUntil - new Date()) / 60000); // minutes
            return sendResponse(res, null, 429, messages.badRequest(`Too many wrong attempts. Try again after ${remainingTime} minutes.`));
        }

        if (user.resetOtp !== otp) {
            // Increment wrong attempts
            const newAttempts = (user.resetOtpWrongAttempts || 0) + 1;
            let updateData = { resetOtpWrongAttempts: newAttempts };

            if (newAttempts >= 4) {
                // Block for 5 minutes
                updateData.resetOtpBlockedUntil = new Date(Date.now() + 300000); // 5 minutes
                updateData.resetOtpWrongAttempts = 0; // Reset attempts after block
                updateData.resetOtpSendBlockedUntil = new Date(Date.now() + 300000); // Block sending OTP
            }

            await userService.updateDocumentById(user._id, updateData);

            return sendResponse(res, null, 400, messages.badRequest("Invalid OTP."));
        }

        // Reset wrong attempts on successful verification
        await userService.updateDocumentById(user._id, {
            resetOtpWrongAttempts: 0,
            resetOtpBlockedUntil: null,
            resetOtpSendBlockedUntil: null
        });

        if (user.resetOtpExpiresAt < new Date()) {
            return sendResponse(res, null, 400, messages.badRequest("OTP has expired."));
        }

        // Clear the reset OTP after successful verification to prevent reuse
        await userService.updateDocumentById(user._id, { resetOtp: null, resetOtpExpiresAt: null });
        return sendResponse(res, null, 200, messages.successResponse("OTP verified successfully."));
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.verifyForgetPasswordOtp.rule = Joi.object({
    otp: Joi.string().length(4).required().messages({
        "string.length": "otp must be 4 digits",
        "string.empty": "otp is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

exports.updatePassword = async (req, res) => {
    const { password, confirmPassword } = req.body;
    try {
        const user = req.user;

        if (user.resetOtp) {
            return sendResponse(res, null, 400, messages.badRequest("OTP not verified."));
        }

        if (password !== confirmPassword) {
            return sendResponse(res, null, 400, messages.badRequest("Password and confirm password do not match."));
        }

        const hashedPassword = await hash.createHash(password);
        await userService.updateDocumentById(req.user._id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiresAt: null,
            resetOtp: null,
            resetOtpExpiresAt: null,
            resetOtpSendAttempts: 0,
            resetOtpSendBlockedUntil: null
        });
        return sendResponse(res, null, 200, messages.successResponse("Password updated successfully."));
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.updatePassword.rule = Joi.object({
    password: Joi.string().min(6).required().messages({
        "string.min": "password must be at least 6 characters",
        "string.empty": "password is required"
    }),
    confirmPassword: Joi.string().required().messages({
        "string.empty": "confirmPassword is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

exports.resendForgetPasswordOtp = async (req, res) => {
    try {
        const user = req.user;

        // Check if user is blocked from resending OTP
        if (user.resetOtpSendBlockedUntil && user.resetOtpSendBlockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.resetOtpSendBlockedUntil - new Date()) / 60000); // minutes
            return sendResponse(res, null, 429, messages.badRequest(`Too many wrong attempts. Try again after ${remainingTime} minutes.`));
        }

        // Check send attempts
        if (user.resetOtpSendAttempts >= 4) {
            // Block for 5 minutes
            await userService.updateDocumentById(user._id, {
                resetOtpSendBlockedUntil: new Date(Date.now() + 300000), // 5 minutes
                resetOtpSendAttempts: 0 // Reset attempts after block
            });
            return sendResponse(res, null, 429, messages.badRequest(`Too many wrong attempts. Try again after 5 minutes.`));
        }

        // Generate new reset OTP and set expiry (5 minutes)
        const resetOtp = generateOtp();
        const resetOtpExpiresAt = new Date(Date.now() + 300000);

        const newSendAttempts = (user.resetOtpSendAttempts || 0) + 1;
        await userService.updateDocumentById(user._id, {
            resetOtp,
            resetOtpExpiresAt,
            resetOtpSendAttempts: newSendAttempts
        });

        // Email subject
        const subject = "🔐 Reset Your Password OTP - Kalyana Vedika";

        // HTML email body with OTP
        const html = `
            <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px; text-align: center;">
                <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Password Reset OTP</h2>
                    <p style="color: #555;">Hello ${user.firstName || "User"},</p>
                    <p style="color: #555;">
                        We received a request to reset your password for your <strong>Kalyana Vedika</strong> account.
                        Use the OTP below to reset your password:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 5px; margin: 20px 0;">
                        ${resetOtp}
                    </div>
                    <p style="color: #777; font-size: 14px;">
                        This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.
                    </p>
                    <p style="margin-top: 30px; color: #999; font-size: 13px;">
                        If you didn’t request this, please ignore this email.
                    </p>
                </div>
            </div>
        `;

        // Send email using HTML
        const emailResult = await sendEmail(user.email, subject, "", html);

        if (!emailResult.success) {
            return sendResponse(res, null, 500, messages.internalServerError("Failed to send reset OTP email."));
        }

        return sendResponse(res, null, 200, messages.successResponse("Reset OTP resent to your email."));
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.resendForgetPasswordOtp.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });


