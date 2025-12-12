require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const config = require("./config/config");
const dbConfig = require("./config/dbConfig");

const app = express();

config(app);

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms'
  )
);

const staticPath = path.join(__dirname, "uploads");
if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath);
}
app.use("/uploads", express.static(staticPath));

dbConfig(app);