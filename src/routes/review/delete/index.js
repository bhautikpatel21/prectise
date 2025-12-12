const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Review = require("../../../model/review.model");
const reviewService = require("../../../service/dbService")({
    model: Review
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        // Check if review exists
        const existingReview = await reviewService.getDocumentById(id);

        if (!existingReview) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Review not found.")
            );
        }

        // Check if review belongs to the user
        if (existingReview.user.toString() !== userId.toString()) {
            return sendResponse(
                res,
                null,
                403,
                messages.unAuthorizedRequest("You can only delete your own reviews.")
            );
        }

        // Delete review
        await reviewService.deleteDocumentById(id);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Review deleted successfully.")
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "id is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

