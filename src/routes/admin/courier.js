const express = require('express');
const router = express.Router();
const Courier = require('../../model/courier.model');
const fshipService = require('../../service/fshipService');
const { sendResponse, messages } = require("../../helpers/handleResponse");

// Sync couriers from F-Ship
router.post('/sync', async (req, res) => {
    try {
        const response = await fshipService.getAllCouriers();

        if (!response.success) {
            return sendResponse(res, null, response.status, messages.badRequest(response.error));
        }

        const couriers = response.data || [];
        const syncedCouriers = [];

        for (const courier of couriers) {
            const updatedCourier = await Courier.findOneAndUpdate(
                { courierId: courier.courierId },
                {
                    courierName: courier.courierName,
                    logoUrl: courier.logoUrl,
                    isActive: true,
                    serviceType: courier.serviceType || 'surface',
                    supportedServices: courier.supportedServices || ['forward']
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

// Get all couriers
router.get('/', async (req, res) => {
    try {
        const couriers = await Courier.find().sort({ priority: -1, courierName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Couriers retrieved successfully", couriers));
    } catch (error) {
        console.error('Error fetching couriers:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get active couriers
router.get('/active', async (req, res) => {
    try {
        const couriers = await Courier.find({ isActive: true }).sort({ priority: -1, courierName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Active couriers retrieved successfully", couriers));
    } catch (error) {
        console.error('Error fetching active couriers:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Update courier settings
router.put('/:id', async (req, res) => {
    try {
        const courier = await Courier.findById(req.params.id);
        if (!courier) {
            return sendResponse(res, null, 404, messages.badRequest("Courier not found"));
        }

        const { isActive, priority, serviceType, supportedServices } = req.body;

        // Update courier
        Object.assign(courier, {
            isActive: isActive !== undefined ? isActive : courier.isActive,
            priority: priority !== undefined ? priority : courier.priority,
            serviceType: serviceType || courier.serviceType,
            supportedServices: supportedServices || courier.supportedServices
        });

        await courier.save();

        return sendResponse(res, null, 200, messages.successResponse("Courier updated successfully", courier));
    } catch (error) {
        console.error('Error updating courier:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Delete courier (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const courier = await Courier.findById(req.params.id);
        if (!courier) {
            return sendResponse(res, null, 404, messages.badRequest("Courier not found"));
        }

        courier.isActive = false;
        await courier.save();

        return sendResponse(res, null, 200, messages.successResponse("Courier deactivated successfully"));
    } catch (error) {
        console.error('Error deactivating courier:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Update courier priority
router.patch('/:id/priority', async (req, res) => {
    try {
        const { priority } = req.body;

        if (priority < 0 || priority > 10) {
            return sendResponse(res, null, 400, messages.badRequest("Priority must be between 0 and 10"));
        }

        const courier = await Courier.findByIdAndUpdate(
            req.params.id,
            { priority },
            { new: true }
        );

        if (!courier) {
            return sendResponse(res, null, 404, messages.badRequest("Courier not found"));
        }

        return sendResponse(res, null, 200, messages.successResponse("Courier priority updated successfully", courier));
    } catch (error) {
        console.error('Error updating courier priority:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

module.exports = router;
