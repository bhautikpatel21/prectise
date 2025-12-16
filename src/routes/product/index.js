const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");

const add = require("./add");
const get = require("./get");
const getSingle = require("./getSingle");
const update = require("./update");
const deleteProduct = require("./delete");
const newArrival = require("./newArrival");
const trandingNow = require("./trandingNow");

router.post(
    "/add",
    validator("body", add.rule),
    add.handler
);

router.get(
    "/get",
    validator("query", get.rule),
    get.handler
);

router.get(
    "/newArrival",
    validator("query", newArrival.rule),
    newArrival.handler
);

router.get(
    "/trandingNow",
    validator("query", trandingNow.rule),
    trandingNow.handler
);

router.get(
    "/getSingle/:id",
    validator("params", getSingle.rule),
    getSingle.handler
);

router.put(
    "/update/:id",
    validator("params", update.paramsRule),
    validator("body", update.rule),
    update.handler
);

router.delete(
    "/delete/:id",
    validator("params", deleteProduct.rule),
    deleteProduct.handler
);

module.exports = router;

