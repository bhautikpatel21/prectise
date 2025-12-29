const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const Product = require("../../../model/product.model");
const orderService = require("../../../service/dbService")({
    model: Order
});
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity, size, shippingAddress, paymentMethod } = req.body;

        // Validate productId
        if (!objectIdValidation(productId)) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Invalid product ID")
            );
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

        // Calculate total amount
        const totalAmount = product.price * (quantity || 1);

        // Create order item for single product
        const orderItems = [{
            product: product._id,
            quantity: quantity || 1,
            size: size || null,
            price: product.price
        }];

        // Create order
        const order = await orderService.createDocument({
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            status: 'pending',
            orderDate: new Date()
        });

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
    productId: Joi.string().required().messages({
        "string.empty": "productId is required"
    }),
    quantity: Joi.number().integer().min(1).optional().default(1),
    size: Joi.string().optional().allow(null),
    shippingAddress: Joi.string().required().messages({
        "string.empty": "shippingAddress is required"
    }),
    paymentMethod: Joi.string().valid('cod', 'prepaid').required().messages({
        "any.only": "paymentMethod must be either 'cod' or 'prepaid'",
        "string.empty": "paymentMethod is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

