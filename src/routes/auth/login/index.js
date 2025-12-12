const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const User = require("../../../model/user.model");
const userService = require("../../../service/dbService")({
    model: User
});
const { hash } = require("../../../helpers/hash");

exports.handler = async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await userService.getSingleDocumentByQuery({ email: { $regex: `^${email}$`, $options: "i" } });
    if (!user) {
        return sendResponse(
            res,
            null,
            401,
            messages.invalidCredentials()
        );
    }

    // Verify password
    const isPasswordValid = await hash.verifyHash(password, user.password);
    if (!isPasswordValid) {
        return sendResponse(
            res,
            null,
            401,
            messages.invalidCredentials()
        );
    } 

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, email: user.email, key: user.password },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "90d" }
    );

    return sendResponse(
        res,
        null,
        200,
        messages.loginSuccess("Login successful.", { userId: user._id, token })
    );
};

exports.rule = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "email must be a valid email",
        "string.empty": "email is required"
    }),
    password: Joi.string().required().messages({
        "string.empty": "password is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
