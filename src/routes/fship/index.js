const express = require('express');
const router = express.Router();
const fshipService = require('../../service/fshipService');
const Courier = require('../../model/courier.model');
const Warehouse = require('../../model/warehouse.model');
const Order = require('../../model/order.model');
const { sendResponse, messages } = require("../../helpers/handleResponse");

// ==================== COURIER MANAGEMENT ====================

// Get all couriers from F-Ship and sync to database
router.get('/couriers/sync', async (req, res) => {
    try {
        const response = await fshipService.getAllCouriers();

        if (!response.success) {
            return sendResponse(res, null, response.status, messages.badRequest(response.error));
        }

        // Sync couriers to database
        const couriers = response.data || [];
        const syncedCouriers = [];

        for (const courier of couriers) {
            const updatedCourier = await Courier.findOneAndUpdate(
                { courierId: courier.courierId },
                {
                    courierName: courier.courierName,
                    logoUrl: courier.logoUrl,
                    isActive: true
                },
                { upsert: true, new: true }
            );
            syncedCouriers.push(updatedCourier);
        }

        return sendResponse(res, null, 200, messages.successResponse("Couriers synced successfully", syncedCouriers));
    } catch (error) {
        console.error('Error syncing couriers:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get all couriers from database
router.get('/couriers', async (req, res) => {
    try {
        const couriers = await Courier.find({ isActive: true }).sort({ priority: -1, courierName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Couriers retrieved successfully", couriers));
    } catch (error) {
        console.error('Error fetching couriers:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// ==================== RATE CALCULATOR ====================

// Calculate shipping rates
router.post('/rate-calculator', async (req, res) => {
    try {
        const { sourcePincode, destinationPincode, paymentMode, amount, expressType, weight, length, width, height, volumetricWeight } = req.body;

        // Get default warehouse pincode if source not provided
        let sourcePin = sourcePincode;
        if (!sourcePin) {
            const defaultWarehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
            sourcePin = defaultWarehouse?.pincode || '394185';
        }

        const rateData = {
            source_Pincode: sourcePin,
            destination_Pincode: destinationPincode,
            payment_Mode: paymentMode || 'P',
            amount: amount || 0,
            express_Type: expressType || 'surface',
            shipment_Weight: weight || 0.5,
            shipment_Length: length || 10,
            shipment_Width: width || 10,
            shipment_Height: height || 10,
            volumetric_Weight: volumetricWeight || 0
        };

        const response = await fshipService.getRateCalculator(rateData);

        if (!response.success) {
            return sendResponse(res, null, response.status, messages.badRequest(response.error));
        }

        return sendResponse(res, null, 200, messages.successResponse("Rate calculated successfully", response.data));
    } catch (error) {
        console.error('Error calculating rate:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// ==================== PINCODE SERVICEABILITY ====================

// Check pincode serviceability
router.post('/pincode-serviceability', async (req, res) => {
    try {
        const { sourcePincode, destinationPincode } = req.body;

        // Get default warehouse pincode if source not provided
        let sourcePin = sourcePincode;
        if (!sourcePin) {
            const defaultWarehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
            sourcePin = defaultWarehouse?.pincode || '394185';
        }

        const response = await fshipService.checkPincodeServiceability(sourcePin, destinationPincode);

        if (!response.success) {
            return sendResponse(res, null, response.status, messages.badRequest(response.error));
        }

        return sendResponse(res, null, 200, messages.successResponse("Pincode serviceability checked", response.data));
    } catch (error) {
        console.error('Error checking pincode serviceability:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// ==================== TRACKING (PUBLIC) ====================

// Track order by order ID (for customers)
router.get('/track/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return sendResponse(res, null, 404, messages.badRequest("Order not found"));
        }

        if (!order.awbNumber) {
            return sendResponse(res, null, 200, messages.successResponse("Order tracking info", {
                orderId: order._id,
                status: order.status,
                fshipStatus: order.fshipStatus,
                message: "Shipment not yet created with courier"
            }));
        }

        // Get tracking from F-Ship
        const trackingResponse = await fshipService.getTrackingHistory(order.awbNumber);
        const summaryResponse = await fshipService.getShipmentSummary(order.awbNumber);

        // Get origin and destination info
        const shippingAddress = order.shippingAddress || {};
        const warehouse = await Warehouse.findOne({ isDefault: true });
        
        // Extract estimated delivery from F-Ship response if available
        let estimatedDelivery = order.estimatedDeliveryDate;
        if (summaryResponse.success && summaryResponse.data?.summary?.edd) {
            estimatedDelivery = summaryResponse.data.summary.edd;
        }

        return sendResponse(res, null, 200, messages.successResponse("Tracking info retrieved", {
            orderId: order._id,
            awbNumber: order.awbNumber,
            deliveryPartner: order.deliveryPartner,
            status: order.status,
            fshipStatus: order.fshipStatus,
            estimatedDeliveryDate: estimatedDelivery,
            originCity: warehouse?.city || 'Origin Warehouse',
            originPincode: warehouse?.pincode,
            destinationCity: shippingAddress.city || 'Destination',
            destinationPincode: shippingAddress.pincode,
            trackingHistory: trackingResponse.success ? trackingResponse.data : null,
            currentStatus: summaryResponse.success ? summaryResponse.data : null,
            statusHistory: order.statusHistory,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt
        }));
    } catch (error) {
        console.error('Error tracking order:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Track by AWB number directly
router.post('/track-awb', async (req, res) => {
    try {
        const { awbNumber } = req.body;

        if (!awbNumber) {
            return sendResponse(res, null, 400, messages.badRequest("AWB number is required"));
        }

        const trackingResponse = await fshipService.getTrackingHistory(awbNumber);

        if (!trackingResponse.success) {
            return sendResponse(res, null, trackingResponse.status, messages.badRequest(trackingResponse.error));
        }

        return sendResponse(res, null, 200, messages.successResponse("Tracking info retrieved", trackingResponse.data));
    } catch (error) {
        console.error('Error tracking AWB:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// ==================== WAREHOUSES ====================

// Get active warehouses (for order creation)
router.get('/warehouses', async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ isActive: true }).sort({ isDefault: -1, warehouseName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Warehouses retrieved", warehouses));
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get default warehouse
router.get('/warehouses/default', async (req, res) => {
    try {
        const warehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
        
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("No default warehouse configured"));
        }

        return sendResponse(res, null, 200, messages.successResponse("Default warehouse retrieved", warehouse));
    } catch (error) {
        console.error('Error fetching default warehouse:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

module.exports = router;
