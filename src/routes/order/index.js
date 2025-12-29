const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");

const create = require("./create");
const buyNow = require("./buyNow");
const view = require("./view");
const cancel = require("./cancel");
const returnOrder = require("./return");
const getAll = require("./getAll");
const getAllOrders = require("./getAllOrders");
const customTShirt = require("./customTShirt");
const deleteOrder = require("./delete");

router.post(
    "/create",
    authToken,
    validator("body", create.rule),
    create.handler
);

router.post(
    "/buyNow",
    authToken,
    validator("body", buyNow.rule),
    buyNow.handler
);

router.get(
    "/view/:id",
    authToken,
    validator("params", view.rule),
    view.handler
);

router.put(
    "/cancel/:id",
    authToken,
    validator("params", cancel.paramsRule),
    validator("body", cancel.rule),
    cancel.handler
);

router.put(
    "/return/:id",
    authToken,
    validator("params", returnOrder.paramsRule),
    validator("body", returnOrder.rule),
    returnOrder.handler
);

router.get(
    "/getAll",
    authToken,
    validator("query", getAll.rule),
    getAll.handler
);

router.get(
    "/getAllOrders",
    validator("query", getAllOrders.rule),
    getAllOrders.handler
);

router.post(
    "/customTShirt",
    authToken,
    validator("body", customTShirt.rule),
    customTShirt.handler
);

router.delete(
    "/delete/:id",
    validator("params", deleteOrder.rule),
    deleteOrder.handler
);

module.exports = router;

