const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Cart = require("../../../model/cart.model");
const cartService = require("../../../service/dbService")({
    model: Cart
});

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart) {
            return sendResponse(
                res,
                null,
                200,
                messages.successResponse("Cart retrieved successfully.", {
                    user: userId,
                    items: [],
                    totalPrice: 0
                })
            );
        }

        // Calculate total price
        const totalPrice = cart.items.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity);
        }, 0);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Cart retrieved successfully.", {
                ...cart.toObject(),
                totalPrice
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

