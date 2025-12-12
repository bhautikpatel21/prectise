const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");

exports.handler = async (req, res) => {
    try {
        const { id } = req.params;
        const { actualDeliveryDate } = req.body;

        // Find the order
        const order = await Order.findById(id);

        if (!order) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found")
            );
        }

        // Check if order is in shipped status
        if (order.status !== "shipped") {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Order must be shipped before delivering")
            );
        }

        // Update order with delivery details
        order.status = "delivered";
        order.actualDeliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : new Date();

        await order.save();

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Order delivered successfully", {
                orderId: order._id,
                status: order.status,
                actualDeliveryDate: order.actualDeliveryDate
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.paramsRule = Joi.object({
    id: Joi.string().required().messages({
        "string.empty": "Order ID is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

exports.rule = Joi.object({
    actualDeliveryDate: Joi.date().optional().messages({
        "date.base": "actualDeliveryDate must be a valid date"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
