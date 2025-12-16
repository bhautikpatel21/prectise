const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Wishlist = require("../../../model/wishlist.model");
const wishlistService = require("../../../service/dbService")({
    model: Wishlist
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;

        const wishlist = await wishlistService.getSingleDocumentByQuery({ user: userId });

        if (!wishlist) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Wishlist not found.")
            );
        }
        // Delete entire wishlist
        await wishlistService.deleteDocumentById(wishlist._id);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Wishlist deleted successfully.")
        );

    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    productId: objectIdValidation().optional().messages({
        "string.base": "productId must be a valid ObjectId"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

