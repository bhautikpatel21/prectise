const mongoose = require("mongoose");
const routes = require("../src/routes/index");

module.exports = (app) => {
  const PORT = process.env.PORT || 8080;
  const DATABASE_URL = process.env.DATABASE_URL;

  mongoose
    .connect(DATABASE_URL)
    .then(() => {
      console.log("INFO: Successfully connected to the database");

      routes(app);

      app.listen(PORT, () => {
        console.log(`INFO: Server is running on PORT: ${PORT}`);
      });
    })
    .catch((err) => {
      console.log("INFO: Could not connect to the database.", err);
      process.exit();
    });
};