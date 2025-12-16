const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    size: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    }
}, {
    _id: true
});

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: {
        type: [orderItemSchema],
        required: true
    },

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },

    paymentId: {
        type: String,
        trim: true
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },

    shippingAddress: {
        type: String,
        required: true,
        trim: true
    },

    orderDate: {
        type: Date,
        default: Date.now
    },

    deliveryDate: {
        type: Date
    },

    cancelDate: {
        type: Date
    },

    returnDate: {
        type: Date
    },

    cancelReason: {
        type: String,
        trim: true
    },

    returnReason: {
        type: String,
        trim: true
    },

    // Logistics fields
    trackingNumber: {
        type: String,
        trim: true
    },

    estimatedDeliveryDate: {
        type: Date
    },

    actualDeliveryDate: {
        type: Date
    },

    deliveryPartner: {
        type: String,
        trim: true
    },

    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String,
            trim: true
        }
    }]

}, {
    versionKey: false,
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
