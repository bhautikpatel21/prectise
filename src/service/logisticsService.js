const { sendEmail } = require("../helpers/email");
const Order = require("../model/order.model");

class LogisticsService {
    // Update order status and add to history
    static async updateOrderStatus(orderId, newStatus, note = "") {
        const order = await Order.findById(orderId).populate('user', 'name email');

        if (!order) {
            throw new Error("Order not found");
        }

        // Add to status history
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note: note
        });

        // Update current status
        order.status = newStatus;

        // Set specific dates based on status
        if (newStatus === 'shipped') {
            // estimatedDeliveryDate should be set when shipping
        } else if (newStatus === 'delivered') {
            order.actualDeliveryDate = new Date();
        }

        await order.save();

        // Send email notification
        await this.sendStatusUpdateEmail(order, newStatus);

        return order;
    }

    // Send email notification for status updates
    static async sendStatusUpdateEmail(order, status) {
        const subject = `Order ${order._id} Status Update`;
        const userEmail = order.user.email;
        const userName = order.user.name;

        let statusMessage = "";
        let htmlContent = "";

        switch (status) {
            case 'confirmed':
                statusMessage = "Your order has been confirmed and is being prepared.";
                htmlContent = `
                    <h2>Order Confirmed!</h2>
                    <p>Dear ${userName},</p>
                    <p>Your order #${order._id} has been confirmed and is being prepared for shipment.</p>
                    <p>We'll notify you once it's shipped.</p>
                `;
                break;
            case 'shipped':
                statusMessage = `Your order has been shipped. Tracking Number: ${order.trackingNumber || 'N/A'}`;
                htmlContent = `
                    <h2>Order Shipped!</h2>
                    <p>Dear ${userName},</p>
                    <p>Your order #${order._id} has been shipped.</p>
                    ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
                    ${order.deliveryPartner ? `<p><strong>Delivery Partner:</strong> ${order.deliveryPartner}</p>` : ''}
                    ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryDate.toDateString()}</p>` : ''}
                    <p>You can track your order status in your account.</p>
                `;
                break;
            case 'delivered':
                statusMessage = "Your order has been delivered successfully.";
                htmlContent = `
                    <h2>Order Delivered!</h2>
                    <p>Dear ${userName},</p>
                    <p>Your order #${order._id} has been delivered successfully.</p>
                    <p>Thank you for shopping with us!</p>
                    <p>If you have any issues with your order, please contact our support.</p>
                `;
                break;
            case 'cancelled':
                statusMessage = "Your order has been cancelled.";
                htmlContent = `
                    <h2>Order Cancelled</h2>
                    <p>Dear ${userName},</p>
                    <p>Your order #${order._id} has been cancelled.</p>
                    <p>If you have any questions, please contact our support.</p>
                `;
                break;
            case 'returned':
                statusMessage = "Your return request has been processed.";
                htmlContent = `
                    <h2>Return Processed</h2>
                    <p>Dear ${userName},</p>
                    <p>Your return request for order #${order._id} has been processed.</p>
                    <p>We'll process your refund shortly.</p>
                `;
                break;
        }

        htmlContent += `
            <br>
            <p>Order Details:</p>
            <ul>
                <li>Order ID: ${order._id}</li>
                <li>Total Amount: ₹${order.totalAmount}</li>
                <li>Status: ${status}</li>
            </ul>
            <br>
            <p>Best regards,<br>KalyanaVedika Team</p>
        `;

        try {
            await sendEmail(userEmail, subject, statusMessage, htmlContent);
            console.log(`Status update email sent to ${userEmail} for order ${order._id}`);
        } catch (error) {
            console.error("Failed to send status update email:", error);
        }
    }

    // Get tracking information
    static async getTrackingInfo(orderId, userId) {
        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .populate('items.product', 'name price images');

        if (!order) {
            throw new Error("Order not found");
        }

        // Check ownership
        if (order.user._id.toString() !== userId.toString()) {
            throw new Error("Unauthorized access to order");
        }

        return {
            orderId: order._id,
            status: order.status,
            trackingNumber: order.trackingNumber,
            deliveryPartner: order.deliveryPartner,
            estimatedDeliveryDate: order.estimatedDeliveryDate,
            actualDeliveryDate: order.actualDeliveryDate,
            statusHistory: order.statusHistory,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
            orderDate: order.orderDate
        };
    }

    // Get admin dashboard stats
    static async getLogisticsStats() {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments();
        const pendingShipments = await Order.countDocuments({ status: "confirmed" });
        const inTransit = await Order.countDocuments({ status: "shipped" });
        const deliveredToday = await Order.countDocuments({
            status: "delivered",
            actualDeliveryDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        });

        return {
            totalOrders,
            statusBreakdown: stats,
            pendingShipments,
            inTransit,
            deliveredToday
        };
    }
}

module.exports = LogisticsService;
