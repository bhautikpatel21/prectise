const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.handler = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order
        const order = await Order.findById(orderId).populate('user', 'name email');

        if (!order) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found")
            );
        }

        // Check if order belongs to the user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return sendResponse(
                res,
                null,
                403,
                messages.forbidden("You are not authorized to access this order")
            );
        }

        // Check if order is in pending status
        if (order.status !== 'pending') {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Order is not in pending status")
            );
        }

        // Create Razorpay order
        const options = {
            amount: order.totalAmount * 100, // amount in paisa
            currency: "INR",
            receipt: `order_${order._id}`,
            payment_capture: 1, // auto capture
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Update order with payment ID
        order.paymentId = razorpayOrder.id;
        await order.save();

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Payment order created successfully", {
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    orderId: Joi.string().required().messages({
        "string.empty": "orderId is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
