const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Review = require("../../../model/review.model");
const reviewService = require("../../../service/dbService")({
    model: Review
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const { productId, pageNumber = 1, pageSize = 20 } = req.query;

        let where = {};

        // Filter by product if provided
        if (productId) {
            where.product = productId;
        }

        // Get reviews with pagination
        const reviews = await reviewService.getDocumentByQueryPopulate(
            where,
            [],
            [
                { path: 'user', select: 'name email' },
                { path: 'product', select: 'title' }
            ],
            { createdAt: -1 },
            parseInt(pageNumber),
            parseInt(pageSize)
        );

        const totalCount = await reviewService.getCountDocument(where);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Reviews retrieved successfully.", reviews, {
                totalCount,
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / parseInt(pageSize))
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    productId: objectIdValidation().optional().messages({
        "string.base": "productId must be a valid ObjectId"
    }),
    pageNumber: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(100).optional()
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

