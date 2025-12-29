const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema({

    heroMobileImage : {
        type : String,
    },

    heroDesktopImage : {
        type : String,
    },

    collectionMobileImage : {
        type : String,
    },

    collectionDesktopImage : {
        type : String,
    },

    saleImage : {
        type : String,
    }

}, {
    versionKey: false,
    timestamps: true
});

const homepage = mongoose.model('homepage', homepageSchema);

module.exports = homepage;

