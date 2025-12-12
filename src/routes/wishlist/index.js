const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");

const add = require("./add");
const get = require("./get");
const deleteWishlist = require("./delete");
const removeItem = require("./removeItem");

router.post(
    "/add",
    authToken,
    validator("body", add.rule),
    add.handler
);

router.get(
    "/get",
    authToken,
    validator("query", get.rule),
    get.handler
);

router.delete(
    "/removeItem",
    authToken,
    validator("body", removeItem.rule),
    removeItem.handler
);

router.delete(
    "/delete",
    authToken,
    validator("query", deleteWishlist.rule),
    deleteWishlist.handler
);

module.exports = router;

