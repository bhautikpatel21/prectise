const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const crypto = require("crypto");

exports.handler = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Payment verification failed")
            );
        }

        // Find and update order
        const order = await Order.findOne({ paymentId: razorpay_order_id });

        if (!order) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found")
            );
        }

        order.paymentStatus = 'paid';
        order.status = 'confirmed'; // Update order status to confirmed after payment
        await order.save();

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Payment verified successfully", {
                orderId: order._id,
                paymentId: razorpay_payment_id,
                status: order.status
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    razorpay_order_id: Joi.string().required().messages({
        "string.empty": "razorpay_order_id is required"
    }),
    razorpay_payment_id: Joi.string().required().messages({
        "string.empty": "razorpay_payment_id is required"
    }),
    razorpay_signature: Joi.string().required().messages({
        "string.empty": "razorpay_signature is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
