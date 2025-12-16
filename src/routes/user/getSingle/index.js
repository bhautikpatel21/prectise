const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");

exports.handler = async (req, res) => {
    try {
        // User is already available from authToken middleware
        const user = req.user;

        if (!user) {
            return sendResponse(
                res,
                null,
                401,
                messages.unAuthorizedRequest("User not found.")
            );
        }

        // Remove sensitive information before sending
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("User retrieved successfully.", userData)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

