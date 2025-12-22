const Joi = require("joi");
const path = require("path");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Review = require("../../../model/review.model");
const Product = require("../../../model/product.model");
const reviewService = require("../../../service/dbService")({
    model: Review
});
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        // Handle both JSON and form-data
        const productId = req.body.productId;
        const rating = req.body.rating ? parseInt(req.body.rating) : undefined;
        const comment = req.body.comment;
        
        // Handle uploaded images
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => {
                const imagePath = path.join("uploads", file.filename);
                return imagePath.replace(path.sep, "/");
            });
        }

        // Verify product exists
        const product = await productService.getDocumentById(productId);
        if (!product) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Product not found.")
            );
        }

        // Check if user already reviewed this product
        const existingReview = await reviewService.getSingleDocumentByQuery({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("You have already reviewed this product. You can update your existing review instead.")
            );
        }

        // Create review
        const review = await reviewService.createDocument({
            user: userId,
            product: productId,
            rating,
            comment,
            images: imagePaths
        });

        // Populate user and product details
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'name email')
            .populate('product', 'title');

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Review created successfully.", populatedReview)
        );
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("You have already reviewed this product.")
            );
        }
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    productId: objectIdValidation().required().messages({
        "any.required": "productId is required"
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "rating must be a number",
        "number.integer": "rating must be an integer",
        "number.min": "rating must be at least 1",
        "number.max": "rating must be at most 5",
        "any.required": "rating is required"
    }),
    comment: Joi.string().required().trim().messages({
        "string.empty": "comment is required",
        "any.required": "comment is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

