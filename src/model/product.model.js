const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    mainImage: {
        type: String,
        required: true,
        trim: true
    },

    sideImages: {
        type: [String],
        default: []
    },

    sizes: {
        type: [String],
        default: []
    },

    price : {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

}, {
    versionKey: false,
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

