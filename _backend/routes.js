const express = require("express");
const meterRoutes = require("./controllers/meters");

const router = express.Router();

router.use("/meters", meterRoutes);

module.exports = router;
