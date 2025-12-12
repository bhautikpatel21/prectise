const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const Cart = require("../../../model/cart.model");
const Product = require("../../../model/product.model");
const orderService = require("../../../service/dbService")({
    model: Order
});
const cartService = require("../../../service/dbService")({
    model: Cart
});
const productService = require("../../../service/dbService")({
    model: Product
});

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || !cart.items || cart.items.length === 0) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Cart is empty. Please add items to cart before placing an order.")
            );
        }

        // Calculate total amount and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;
            if (!product) {
                return sendResponse(
                    res,
                    null,
                    404,
                    messages.recordNotFound(`Product not found for item ${item._id}`)
                );
            }

            const itemPrice = product.price * item.quantity;
            totalAmount += itemPrice;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                size: item.size || null,
                price: product.price
            });
        }

        // Create order
        const order = await orderService.createDocument({
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            status: 'pending',
            orderDate: new Date()
        });

        // Clear cart after order creation
        await cartService.updateDocumentById(cart._id, { items: [] });

        // Populate order details
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product')
            .populate('user', 'name email');

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Order created successfully.", populatedOrder)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    shippingAddress: Joi.string().required().messages({
        "string.empty": "shippingAddress is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

