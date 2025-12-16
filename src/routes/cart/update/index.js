const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Cart = require("../../../model/cart.model");
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const { id, newSize, quantity } = req.body;
        const userId = req.user._id;

        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return sendResponse(res, null, 404, messages.recordNotFound("Cart not found"));
        }

        // Find the item to update
        const itemIndex = cart.items.findIndex(item => item._id.toString() === id);
        if (itemIndex === -1) {
            return sendResponse(res, null, 404, messages.recordNotFound("Item not found in cart"));
        }

        // Update quantity if provided
        if (quantity !== undefined) {
            cart.items[itemIndex].quantity = quantity;
        }

        // Update size if newSize provided
        if (newSize !== undefined) {
            const currentItem = cart.items[itemIndex];
            const existingItemIndex = cart.items.findIndex(item =>
                item.product.toString() === currentItem.product.toString() &&
                item.size === newSize &&
                item._id.toString() !== id
            );

            if (existingItemIndex !== -1) {
                // Merge quantities into existing item
                cart.items[existingItemIndex].quantity += currentItem.quantity;
                // Remove the current item
                cart.items.splice(itemIndex, 1);
            } else {
                // No merge, just update size
                currentItem.size = newSize;
            }
        }

        // Save the cart
        await cart.save();

        // Populate product details and calculate total price
        await cart.populate('items.product');
        const totalPrice = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Cart updated successfully.", {
                ...cart.toObject(),
                totalPrice
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "id is required"
    }),
    newSize: Joi.string().allow(null, "").optional().messages({
        "string.base": "newSize must be a string"
    }),
    quantity: Joi.number().integer().min(1).optional().messages({
        "number.base": "quantity must be a number",
        "number.integer": "quantity must be an integer",
        "number.min": "quantity must be at least 1"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
