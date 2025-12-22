const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { customTShirt, shippingAddress, totalAmount, size, quantity } = req.body;

        // Validate custom t-shirt data
        if (!customTShirt || !customTShirt.color) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Custom t-shirt data is required")
            );
        }

        // Create order item for custom t-shirt
        // Since it's a custom product, we'll create a special item structure
        const orderItems = [{
            product: null, // Custom product, no product ID
            quantity: quantity || 1,
            size: size || 'M',
            price: customTShirt.basePrice || totalAmount / (quantity || 1),
            customData: {
                type: 'customTShirt',
                color: customTShirt.color,
                frontTexts: customTShirt.frontTexts || [],
                backTexts: customTShirt.backTexts || [],
                frontImages: customTShirt.frontImages || [],
                backImages: customTShirt.backImages || [],
                frontPreviewImage: customTShirt.frontPreviewImage || null, // Base64 image of front preview
                backPreviewImage: customTShirt.backPreviewImage || null // Base64 image of back preview
            }
        }];

        // Create order
        const order = await orderService.createDocument({
            user: userId,
            items: orderItems,
            totalAmount: totalAmount || (customTShirt.basePrice * (quantity || 1)),
            shippingAddress,
            status: 'pending',
            orderDate: new Date(),
            isCustomOrder: true
        });

        // Populate order details
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email');

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Custom t-shirt order created successfully.", populatedOrder)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    customTShirt: Joi.object({
        color: Joi.string().required(),
        frontTexts: Joi.array().optional(),
        backTexts: Joi.array().optional(),
        frontImages: Joi.array().optional(),
        backImages: Joi.array().optional(),
        frontPreviewImage: Joi.string().optional().allow(null, ''),
        backPreviewImage: Joi.string().optional().allow(null, ''),
        size: Joi.string().optional(),
        quantity: Joi.number().optional(),
        basePrice: Joi.number().optional()
    }).required(),
    shippingAddress: Joi.string().required().messages({
        "string.empty": "shippingAddress is required"
    }),
    totalAmount: Joi.number().required().min(0),
    size: Joi.string().optional(),
    quantity: Joi.number().optional().min(1)
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

