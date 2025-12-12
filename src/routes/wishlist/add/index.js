const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Wishlist = require("../../../model/wishlist.model");
const Product = require("../../../model/product.model");
const wishlistService = require("../../../service/dbService")({
    model: Wishlist
});
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.body;

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

        // Find or create wishlist
        let wishlist = await wishlistService.getSingleDocumentByQuery({ user: userId });

        if (!wishlist) {
            // Create new wishlist
            wishlist = await wishlistService.createDocument({
                user: userId,
                products: [productId]
            });
        } else {
            // Check if product already exists in wishlist
            const productExists = wishlist.products.some(
                id => id.toString() === productId.toString()
            );

            if (productExists) {
                return sendResponse(
                    res,
                    null,
                    400,
                    messages.isAssociated("Product already exists in wishlist.")
                );
            }

            // Add product to wishlist
            wishlist.products.push(productId);
            wishlist = await wishlistService.updateDocumentById(wishlist._id, { products: wishlist.products });
        }

        // Populate product details
        const populatedWishlist = await Wishlist.findById(wishlist._id).populate('products');

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Product added to wishlist successfully.", populatedWishlist)
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

