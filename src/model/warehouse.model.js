const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    warehouseId: {
        type: Number,
        required: true,
        unique: true
    },
    warehouseName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    fshipResponse: {
        type: mongoose.Schema.Types.Mixed,
        // Store full F-Ship API response for debugging
    }
}, {
    timestamps: true
});

// Ensure only one default warehouse
warehouseSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isDefault: true },
            { isDefault: false }
        );
    }
    next();
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
