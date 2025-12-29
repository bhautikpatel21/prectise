const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});
const { upload } = require("../../../middleware/image.middleware");
const path = require('path');
const fs = require('fs');

// Middleware for handling multiple file uploads
const uploadFields = upload.fields([
    { name: 'frontImages', maxCount: 10 },
    { name: 'backImages', maxCount: 10 }
]);

exports.handler = [
    uploadFields,
    async (req, res) => {
        try {
            const userId = req.user._id;
            const { customTShirt, shippingAddress, totalAmount, size, quantity } = req.body;

            // Parse customTShirt if it's a string (from FormData)
            let customTShirtData = customTShirt;
            if (typeof customTShirt === 'string') {
                try {
                    customTShirtData = JSON.parse(customTShirt);
                } catch (e) {
                    return sendResponse(
                        res,
                        null,
                        400,
                        messages.badRequest("Invalid customTShirt data")
                    );
                }
            }

            // Validate custom t-shirt data
            if (!customTShirtData || !customTShirtData.color) {
                return sendResponse(
                    res,
                    null,
                    400,
                    messages.badRequest("Custom t-shirt data is required")
                );
            }

            // Process uploaded images
            const frontImagePaths = [];
            const backImagePaths = [];

            if (req.files && req.files.frontImages) {
                req.files.frontImages.forEach(file => {
                    frontImagePaths.push(`/uploads/${file.filename}`);
                });
            }

            if (req.files && req.files.backImages) {
                req.files.backImages.forEach(file => {
                    backImagePaths.push(`/uploads/${file.filename}`);
                });
            }

            // Create order item for custom t-shirt
            const orderItems = [{
                product: null, // Custom product, no product ID
                quantity: quantity || 1,
                size: size || 'M',
                price: customTShirtData.basePrice || totalAmount / (quantity || 1),
                customData: {
                    type: 'customTShirt',
                    color: customTShirtData.color,
                    frontTexts: customTShirtData.frontTexts || [],
                    backTexts: customTShirtData.backTexts || [],
                    frontImages: frontImagePaths,
                    backImages: backImagePaths,
                    frontPreviewImage: customTShirtData.frontPreviewImage || null,
                    backPreviewImage: customTShirtData.backPreviewImage || null
                }
            }];

            // Create order
            const order = await orderService.createDocument({
                user: userId,
                items: orderItems,
                totalAmount: totalAmount || (customTShirtData.basePrice * (quantity || 1)),
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
    }
];

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

