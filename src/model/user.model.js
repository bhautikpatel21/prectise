const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        trim: true
    },

    resetToken: {
        type: String
    },

    resetTokenExpiresAt: {
        type: Date
    },

    resetOtp: {
        type: String
    },

    resetOtpExpiresAt: {
        type: Date
    },

    resetOtpWrongAttempts: {
        type: Number,
        default: 0
    },

    resetOtpBlockedUntil: {
        type: Date
    },

    resetOtpSendAttempts: {
        type: Number,
        default: 0
    },

    resetOtpSendBlockedUntil: {
        type: Date
    },

}, {
    versionKey: false,
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
