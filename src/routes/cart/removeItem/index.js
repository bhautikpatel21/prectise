const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Cart = require("../../../model/cart.model");
const cartService = require("../../../service/dbService")({
    model: Cart
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.body;

        const cart = await cartService.getSingleDocumentByQuery({ user: userId });

        if (!cart) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Cart not found.")
            );
        }

        // Find item in cart
        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId.toString()
        );

        if (itemIndex === -1) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Item not found in cart.")
            );
        }

        // Remove item from cart
        cart.items.splice(itemIndex, 1);
        const updatedCart = await cartService.updateDocumentById(cart._id, { items: cart.items });

        // Populate product details
        const populatedCart = await Cart.findById(updatedCart._id).populate('items.product');

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Item removed from cart successfully.", populatedCart)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    itemId: objectIdValidation().required().messages({
        "any.required": "itemId is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

