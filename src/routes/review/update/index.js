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
        const { rating, comment } = req.body;

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
                messages.unAuthorizedRequest("You can only update your own reviews.")
            );
        }

        // Prepare update data
        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (comment !== undefined) updateData.comment = comment;

        // Update review
        const updatedReview = await reviewService.updateDocumentById(id, updateData);

        // Populate user and product details
        const populatedReview = await Review.findById(updatedReview._id)
            .populate('user', 'name email')
            .populate('product', 'title');

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Review updated successfully.", populatedReview)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.paramsRule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "id is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

exports.rule = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
        "number.base": "rating must be a number",
        "number.integer": "rating must be an integer",
        "number.min": "rating must be at least 1",
        "number.max": "rating must be at most 5"
    }),
    comment: Joi.string().optional().trim().messages({
        "string.empty": "comment cannot be empty"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

