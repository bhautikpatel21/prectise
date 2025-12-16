const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Email = require("../../../model/email.model");
const emailService = require("../../../service/dbService")({
    model: Email
});

exports.handler = async (req, res) => {
    try {
        const { email } = req.body;

        const exiestEmail = await emailService.getSingleDocumentByQuery({email});

        if (exiestEmail) {
            return sendResponse(res, null, 409, messages.isAssociated("email already subcribe"));
        }

        const emails = await emailService.createDocument({email})

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("subcribe successfully", emails)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    email: Joi.string().email().pattern(/\.com$/).required().messages({
        "string.email": "email must be a valid email",
        "string.pattern.base": "email must end with .com",
        "string.empty": "email is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
