const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Email = require("../../../model/email.model");
const emailService = require("../../../service/dbService")({
    model: Email
});

exports.handler = async (req, res) => {
    try {
        const emails = await emailService.getDocumentByQuery({})

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Emails retrieved successfully.", emails)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};
