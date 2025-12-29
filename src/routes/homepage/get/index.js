const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Homepage = require("../../../model/homepage.model");
const homepageService = require("../../../service/dbService")({
    model: Homepage
});

exports.handler = async (req, res) => {
    try {
        const homepage = await homepageService.getDocumentByQuery({});

        if (!homepage || homepage.length === 0) {
            return sendResponse(
                res,
                null,
                200,
                messages.successResponse("No homepage data found.", null)
            );
        }

        // Return the first (and should be only) homepage document
        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Homepage data retrieved successfully.", homepage[0])
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false);

