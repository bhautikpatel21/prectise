const express = require('express');
const router = express.Router();
const Order = require('../../model/order.model');
const Warehouse = require('../../model/warehouse.model');
const Courier = require('../../model/courier.model');
const fshipService = require('../../service/fshipService');
const LogisticsService = require('../../service/logisticsService');
const { sendResponse, messages } = require("../../helpers/handleResponse");

// Get logistics stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await LogisticsService.getLogisticsStats();
        return sendResponse(res, null, 200, messages.successResponse("Logistics stats retrieved successfully", stats));
    } catch (error) {
        console.error('Error fetching logistics stats:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Create shipment for order
router.post('/orders/:orderId/create-shipment', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email phone')
            .populate('items.product', 'title price category sku');
        
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (order.fshipStatus !== 'not_created') {
            return sendResponse(res, null, 400, messages.badRequest("Shipment already created for this order"));
        }

        const { courierId, warehouseId, paymentMode, expressType, shipmentWeight, shipmentLength, shipmentWidth, shipmentHeight } = req.body;

        // Get warehouse details
        let warehouse = null;
        if (warehouseId) {
            warehouse = await Warehouse.findOne({ warehouseId: warehouseId, isActive: true });
        }
        if (!warehouse) {
            warehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
        }

        if (!warehouse) {
            return sendResponse(res, null, 400, messages.badRequest("No warehouse configured. Please add a warehouse first."));
        }

        // Build order data for F-Ship using the helper method
        const orderData = fshipService.buildOrderDataFromOrder(order, warehouse);
        
        // Override with request body values if provided
        if (courierId) orderData.courierId = courierId;
        if (paymentMode) orderData.payment_Mode = paymentMode === 'COD' ? 1 : 2;
        if (expressType) orderData.express_Type = expressType;
        if (shipmentWeight) orderData.shipment_Weight = shipmentWeight;
        if (shipmentLength) orderData.shipment_Length = shipmentLength;
        if (shipmentWidth) orderData.shipment_Width = shipmentWidth;
        if (shipmentHeight) orderData.shipment_Height = shipmentHeight;

        // Create forward order in F-Ship
        const fshipResponse = await fshipService.createForwardOrder(orderData);

        if (!fshipResponse.success) {
            return sendResponse(res, null, fshipResponse.status || 400, messages.badRequest(
                fshipResponse.error?.response || fshipResponse.error?.message || "Failed to create shipment in F-Ship"
            ));
        }

        // Extract response data (handle both old and new response format)
        const responseData = fshipResponse.data;
        const apiOrderId = responseData.apiorderid || responseData.orderId || responseData.order_id;
        const awbNumber = responseData.waybill || responseData.awb || responseData.awbNumber;
        const routeCode = responseData.route_code || responseData.routeCode || '';

        // Get courier name
        let deliveryPartner = '';
        if (courierId) {
            const courier = await Courier.findOne({ courierId: courierId });
            deliveryPartner = courier?.courierName || '';
        }

        // Update order with F-Ship details
        order.fshipOrderId = apiOrderId;
        order.awbNumber = awbNumber;
        order.trackingNumber = awbNumber;
        order.routeCode = routeCode;
        order.courierId = courierId || order.courierId;
        order.warehouseId = warehouse.warehouseId;
        order.deliveryPartner = deliveryPartner || responseData.courier_name || '';
        order.fshipStatus = 'created';
        order.fshipResponse = responseData;
        order.paymentMode = paymentMode || order.paymentMode;
        order.expressType = expressType || order.expressType;
        order.shipmentWeight = shipmentWeight || order.shipmentWeight;
        order.shipmentLength = shipmentLength || order.shipmentLength;
        order.shipmentWidth = shipmentWidth || order.shipmentWidth;
        order.shipmentHeight = shipmentHeight || order.shipmentHeight;

        // Update order status to confirmed if pending
        if (order.status === 'pending') {
            order.status = 'confirmed';
        }

        // Add to status history
        order.statusHistory.push({
            status: order.status,
            timestamp: new Date(),
            note: `Shipment created. AWB: ${awbNumber}`,
            fshipStatus: 'created'
        });

        await order.save();

        // Send status update email
        try {
            await LogisticsService.sendStatusUpdateEmail(order, 'confirmed');
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

        return sendResponse(res, null, 200, messages.successResponse("Shipment created successfully", {
            orderId: order._id,
            fshipOrderId: apiOrderId,
            awbNumber: awbNumber,
            routeCode: routeCode,
            deliveryPartner: order.deliveryPartner
        }));
    } catch (error) {
        console.error('Error creating shipment:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Register pickup for order
router.post('/orders/:orderId/register-pickup', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user', 'name email');
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (!order.awbNumber) {
            return sendResponse(res, null, 400, messages.badRequest("AWB number not found. Create shipment first."));
        }

        if (order.fshipStatus === 'pickup_registered') {
            return sendResponse(res, null, 400, messages.badRequest("Pickup already registered for this order"));
        }

        // Register pickup
        const pickupResponse = await fshipService.registerPickup([order.awbNumber]);

        if (!pickupResponse.success) {
            return sendResponse(res, null, pickupResponse.status, messages.badRequest(pickupResponse.error));
        }

        // Update order
        order.pickupOrderId = pickupResponse.data.pickupOrderId;
        order.fshipStatus = 'pickup_registered';
        order.fshipResponse = { ...order.fshipResponse, pickup: pickupResponse.data };
        
        // Update order status to shipped
        order.status = 'shipped';
        order.shippedAt = new Date();

        // Add to status history
        order.statusHistory.push({
            status: 'shipped',
            timestamp: new Date(),
            note: 'Pickup registered and order shipped',
            fshipStatus: 'pickup_registered'
        });

        await order.save();

        // Send status update email
        try {
            await LogisticsService.sendStatusUpdateEmail(order, 'shipped');
        } catch (emailError) {
            console.error('Error sending shipped email:', emailError);
        }

        return sendResponse(res, null, 200, messages.successResponse("Pickup registered and order shipped successfully", {
            orderId: order._id,
            pickupOrderId: order.pickupOrderId,
            status: 'shipped'
        }));
    } catch (error) {
        console.error('Error registering pickup:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get shipping label
router.get('/orders/:orderId/shipping-label', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (!order.awbNumber) {
            return sendResponse(res, null, 400, messages.badRequest("AWB number not found"));
        }

        const labelResponse = await fshipService.getShippingLabel(order.awbNumber);

        if (!labelResponse.success) {
            return sendResponse(res, null, labelResponse.status, messages.badRequest(labelResponse.error));
        }

        return sendResponse(res, null, 200, messages.successResponse("Shipping label retrieved successfully", labelResponse.data));
    } catch (error) {
        console.error('Error getting shipping label:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get tracking history
router.get('/orders/:orderId/tracking', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (!order.awbNumber) {
            return sendResponse(res, null, 400, messages.badRequest("AWB number not found"));
        }

        const trackingResponse = await fshipService.getTrackingHistory(order.awbNumber);

        if (!trackingResponse.success) {
            return sendResponse(res, null, trackingResponse.status, messages.badRequest(trackingResponse.error));
        }

        return sendResponse(res, null, 200, messages.successResponse("Tracking history retrieved successfully", trackingResponse.data));
    } catch (error) {
        console.error('Error getting tracking history:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Cancel shipment
router.post('/orders/:orderId/cancel-shipment', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user', 'name email');
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (!order.fshipOrderId) {
            return sendResponse(res, null, 400, messages.badRequest("Shipment not created yet"));
        }

        const { cancelReason } = req.body;

        const cancelData = {
            orderId: order.fshipOrderId,
            reason: cancelReason || 'Order cancelled by admin'
        };

        const cancelResponse = await fshipService.cancelOrder(cancelData);

        if (!cancelResponse.success) {
            return sendResponse(res, null, cancelResponse.status, messages.badRequest(cancelResponse.error));
        }

        // Update order status
        order.fshipStatus = 'cancelled';
        order.status = 'cancelled';
        order.cancelReason = cancelReason || 'Order cancelled by admin';

        // Add to status history
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: `Shipment cancelled: ${cancelReason || 'Order cancelled by admin'}`,
            fshipStatus: 'cancelled'
        });

        await order.save();

        // Send cancellation email
        await LogisticsService.sendStatusUpdateEmail(order, 'cancelled');

        return sendResponse(res, null, 200, messages.successResponse("Shipment cancelled successfully"));
    } catch (error) {
        console.error('Error cancelling shipment:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Update order status
router.patch('/orders/:orderId/status', async (req, res) => {
    try {
        const { status, note } = req.body;

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(status)) {
            return sendResponse(res, null, 400, messages.badRequest("Invalid status"));
        }

        await LogisticsService.updateOrderStatus(req.params.orderId, status, note);

        return sendResponse(res, null, 200, messages.successResponse("Order status updated successfully"));
    } catch (error) {
        console.error('Error updating order status:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get order logistics details
router.get('/orders/:orderId/details', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email')
            .populate('items.product', 'title price images');

        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        const logisticsDetails = {
            orderId: order._id,
            status: order.status,
            fshipStatus: order.fshipStatus,
            fshipOrderId: order.fshipOrderId,
            awbNumber: order.awbNumber,
            routeCode: order.routeCode,
            courierId: order.courierId,
            warehouseId: order.warehouseId,
            pickupOrderId: order.pickupOrderId,
            trackingNumber: order.trackingNumber,
            deliveryPartner: order.deliveryPartner,
            estimatedDeliveryDate: order.estimatedDeliveryDate,
            actualDeliveryDate: order.actualDeliveryDate,
            shipmentWeight: order.shipmentWeight,
            paymentMode: order.paymentMode,
            codAmount: order.codAmount,
            expressType: order.expressType,
            statusHistory: order.statusHistory,
            fshipResponse: order.fshipResponse
        };

        return sendResponse(res, null, 200, messages.successResponse("Logistics details retrieved successfully", logisticsDetails));
    } catch (error) {
        console.error('Error getting logistics details:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

module.exports = router;
