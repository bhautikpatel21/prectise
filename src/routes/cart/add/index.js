const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Cart = require("../../../model/cart.model");
const Product = require("../../../model/product.model");
const cartService = require("../../../service/dbService")({
    model: Cart
});
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity, size } = req.body;

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

        // Check if size is valid (if product has sizes)
        if (size && product.sizes && product.sizes.length > 0) {
            if (!product.sizes.includes(size)) {
                return sendResponse(
                    res,
                    null,
                    400,
                    messages.badRequest(`Invalid size. Available sizes: ${product.sizes.join(", ")}`)
                );
            }
        }

        // Find or create cart
        let cart = await cartService.getSingleDocumentByQuery({ user: userId });

        if (!cart) {
            // Create new cart
            cart = await cartService.createDocument({
                user: userId,
                items: [{
                    product: productId,
                    quantity: quantity || 1,
                    size: size || null
                }]
            });
        } else {
            // Check if item already exists in cart (same product and size)
            const existingItemIndex = cart.items.findIndex(
                item => item.product.toString() === productId.toString() && 
                (item.size || null) === (size || null)
            );

            if (existingItemIndex !== -1) {
                // Update quantity
                cart.items[existingItemIndex].quantity += (quantity || 1);
            } else {
                // Add new item
                cart.items.push({
                    product: productId,
                    quantity: quantity || 1,
                    size: size || null
                });
            }

            cart = await cartService.updateDocumentById(cart._id, { items: cart.items });
        }

        // Populate product details
        const populatedCart = await Cart.findById(cart._id).populate('items.product');

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Item added to cart successfully.", populatedCart)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    productId: objectIdValidation().required().messages({
        "any.required": "productId is required"
    }),
    quantity: Joi.number().integer().min(1).optional().messages({
        "number.base": "quantity must be a number",
        "number.min": "quantity must be at least 1"
    }),
    size: Joi.string().optional().messages({
        "string.empty": "size cannot be empty"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

