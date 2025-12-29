const express = require('express');
const router = express.Router();
const Warehouse = require('../../model/warehouse.model');
const { sendResponse, messages } = require("../../helpers/handleResponse");

// Get all warehouses
router.get('/', async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ isDefault: -1, warehouseName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Warehouses retrieved successfully", warehouses));
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get active warehouses
router.get('/active', async (req, res) => {
    try {
        const warehouses = await Warehouse.find({ isActive: true }).sort({ isDefault: -1, warehouseName: 1 });
        return sendResponse(res, null, 200, messages.successResponse("Active warehouses retrieved successfully", warehouses));
    } catch (error) {
        console.error('Error fetching active warehouses:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Get default warehouse
router.get('/default', async (req, res) => {
    try {
        const warehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("No default warehouse found"));
        }
        return sendResponse(res, null, 200, messages.successResponse("Default warehouse retrieved successfully", warehouse));
    } catch (error) {
        console.error('Error fetching default warehouse:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Create new warehouse
router.post('/', async (req, res) => {
    try {
        const { warehouseId, warehouseName, address, city, state, pincode, contactPerson, contactNumber, email, isActive, isDefault } = req.body;

        // If setting as default, unset other defaults
        if (isDefault) {
            await Warehouse.updateMany({}, { isDefault: false });
        }

        const warehouse = new Warehouse({
            warehouseId,
            warehouseName,
            address,
            city,
            state,
            pincode,
            contactPerson,
            contactNumber,
            email,
            isActive: isActive !== false,
            isDefault: isDefault || false
        });

        await warehouse.save();

        return sendResponse(res, null, 201, messages.successResponse("Warehouse created successfully", warehouse));
    } catch (error) {
        console.error('Error creating warehouse:', error);
        if (error.code === 11000) {
            return sendResponse(res, null, 400, messages.badRequest("Warehouse ID already exists"));
        }
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Update warehouse
router.put('/:id', async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("Warehouse not found"));
        }

        const { warehouseId, warehouseName, address, city, state, pincode, contactPerson, contactNumber, email, isActive, isDefault } = req.body;

        // If setting as default, unset other defaults
        if (isDefault && !warehouse.isDefault) {
            await Warehouse.updateMany({}, { isDefault: false });
        }

        // Update warehouse
        Object.assign(warehouse, {
            warehouseId: warehouseId || warehouse.warehouseId,
            warehouseName: warehouseName || warehouse.warehouseName,
            address: address || warehouse.address,
            city: city || warehouse.city,
            state: state || warehouse.state,
            pincode: pincode || warehouse.pincode,
            contactPerson: contactPerson || warehouse.contactPerson,
            contactNumber: contactNumber || warehouse.contactNumber,
            email: email || warehouse.email,
            isActive: isActive !== undefined ? isActive : warehouse.isActive,
            isDefault: isDefault !== undefined ? isDefault : warehouse.isDefault
        });

        await warehouse.save();

        return sendResponse(res, null, 200, messages.successResponse("Warehouse updated successfully", warehouse));
    } catch (error) {
        console.error('Error updating warehouse:', error);
        if (error.code === 11000) {
            return sendResponse(res, null, 400, messages.badRequest("Warehouse ID already exists"));
        }
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Delete warehouse
router.delete('/:id', async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("Warehouse not found"));
        }

        // Don't allow deletion of default warehouse
        if (warehouse.isDefault) {
            return sendResponse(res, null, 400, messages.badRequest("Cannot delete default warehouse"));
        }

        await Warehouse.findByIdAndDelete(req.params.id);

        return sendResponse(res, null, 200, messages.successResponse("Warehouse deleted successfully"));
    } catch (error) {
        console.error('Error deleting warehouse:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Set as default warehouse
router.patch('/:id/set-default', async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("Warehouse not found"));
        }

        // Unset all defaults first
        await Warehouse.updateMany({}, { isDefault: false });

        // Set this warehouse as default
        warehouse.isDefault = true;
        warehouse.isActive = true; // Default warehouse must be active
        await warehouse.save();

        return sendResponse(res, null, 200, messages.successResponse("Warehouse set as default successfully", warehouse));
    } catch (error) {
        console.error('Error setting default warehouse:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

// Toggle warehouse active status
router.patch('/:id/toggle-active', async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return sendResponse(res, null, 404, messages.badRequest("Warehouse not found"));
        }

        // Don't allow deactivating default warehouse
        if (warehouse.isDefault && warehouse.isActive) {
            return sendResponse(res, null, 400, messages.badRequest("Cannot deactivate default warehouse"));
        }

        warehouse.isActive = !warehouse.isActive;
        await warehouse.save();

        return sendResponse(res, null, 200, messages.successResponse(`Warehouse ${warehouse.isActive ? 'activated' : 'deactivated'} successfully`, warehouse));
    } catch (error) {
        console.error('Error toggling warehouse status:', error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
});

module.exports = router;
