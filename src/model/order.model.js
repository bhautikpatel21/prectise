const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false // Optional for custom orders
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
    },
    customData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
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

    shippedAt: {
        type: Date
    },

    deliveredAt: {
        type: Date
    },

    deliveryPartner: {
        type: String,
        trim: true
    },

    // F-Ship specific fields
    fshipOrderId: {
        type: Number,
        // API order ID from F-Ship
    },

    awbNumber: {
        type: String,
        trim: true,
        // Airway bill number from F-Ship
    },

    routeCode: {
        type: String,
        trim: true
    },

    courierId: {
        type: Number,
        // F-Ship courier ID
    },

    pickupOrderId: {
        type: Number,
        // Pickup order ID from register pickup API
    },

    shipmentWeight: {
        type: Number,
        min: 0
    },

    shipmentLength: {
        type: Number,
        min: 0
    },

    shipmentWidth: {
        type: Number,
        min: 0
    },

    shipmentHeight: {
        type: Number,
        min: 0
    },

    volumetricWeight: {
        type: Number,
        min: 0
    },

    paymentMode: {
        type: String,
        enum: ['COD', 'PREPAID'],
        default: 'PREPAID'
    },

    codAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    expressType: {
        type: String,
        enum: ['air', 'surface'],
        default: 'surface'
    },

    isNdd: {
        type: Boolean,
        default: false
    },

    warehouseId: {
        type: Number,
        // Reference to warehouse used for pickup
    },

    fshipStatus: {
        type: String,
        enum: ['not_created', 'created', 'pickup_registered', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'not_created'
    },

    fshipResponse: {
        type: mongoose.Schema.Types.Mixed,
        // Store full F-Ship API response for debugging
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
        },
        fshipStatus: {
            type: String,
            trim: true
        }
    }],

    isCustomOrder: {
        type: Boolean,
        default: false
    }

}, {
    versionKey: false,
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
