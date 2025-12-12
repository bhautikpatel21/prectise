const bcrypt = require("bcryptjs");

const hash = {
    createHash: async (inputStr) => {
        return bcrypt.hash(inputStr, 12);
    },

    verifyHash: async (inputStr, hashStr) => {
        return bcrypt.compare(inputStr, hashStr);
    },
};

module.exports = { hash };