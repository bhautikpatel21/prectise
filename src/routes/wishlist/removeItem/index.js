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
        const { productId } = req.body;

        const wishlist = await wishlistService.getSingleDocumentByQuery({ user: userId });

        if (!wishlist) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Wishlist not found.")
            );
        }

        // Find product in wishlist
        const productIndex = wishlist.products.findIndex(
            id => id.toString() === productId.toString()
        );

        if (productIndex === -1) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Product not found in wishlist.")
            );
        }

        // Remove product from wishlist
        wishlist.products.splice(productIndex, 1);
        const updatedWishlist = await wishlistService.updateDocumentById(wishlist._id, { products: wishlist.products });

        // Populate product details
        const populatedWishlist = await Wishlist.findById(updatedWishlist._id).populate('products');

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Product removed from wishlist successfully.", populatedWishlist)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    productId: objectIdValidation().required().messages({
        "any.required": "productId is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

