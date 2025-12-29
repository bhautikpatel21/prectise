const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema({
    courierId: {
        type: Number,
        required: true,
        unique: true
    },
    courierName: {
        type: String,
        required: true,
        trim: true
    },
    logoUrl: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    serviceType: {
        type: String,
        enum: ['surface', 'air', 'express'],
        default: 'surface'
    },
    supportedServices: [{
        type: String,
        enum: ['forward', 'reverse', 'pickup', 'cod', 'prepaid']
    }],
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    }
}, {
    timestamps: true
});

// Index for faster queries
courierSchema.index({ isActive: 1, priority: -1 });

const Courier = mongoose.model('Courier', courierSchema);

module.exports = Courier;
