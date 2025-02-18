const express = require("express");
const { getMeters, addMeter, getMeterReadings } = require("./meterController");

const router = express.Router();

// router.get("/", getMeters);
// router.post("/", addMeter);
router.get("/readings", getMeterReadings);

module.exports = router;