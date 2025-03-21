const express = require("express");
const { getAllMeterReadings,
        getMeterReadingsByID,
        addMeter,
        updateMeterByID,
        deleteMeterByID } = require("./meterController");

const router = express.Router();

// router.get("/", getMeters);
// router.post("/", addMeter);


router.get("/getAllMeters", getAllMeterReadings);
router.get("/getMeterByID/:id", getMeterReadingsByID);
router.post("/addMeter", addMeter);
router.put("/updateMeterByID/:id", updateMeterByID);
router.delete("/getMeterByID/:id", deleteMeterByID);


module.exports = router;