const Meter = require('../models/meterModel');

exports.getAllMeters = async (req, res) => {
  console.log('meters controller');
  try {
    const meters = await Meter.getAll();
    res.json(meters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMeterById = async (req, res) => {
  try {
    const meter = await Meter.getById(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    res.json(meter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMeter = async (req, res) => {
  try {
    const meterId = await Meter.create(req.body);
    res.status(201).json({ meter_id: meterId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMeter = async (req, res) => {
  try {
    await Meter.update(req.params.id, req.body);
    res.json({ message: 'Meter updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMeter = async (req, res) => {
  try {
    await Meter.delete(req.params.id);
    res.json({ message: 'Meter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateFromReadings = async (req, res) => {
  try {
    await Meter.updateFromReadings();
    res.status(200).json({ message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update meters", error: error.message });
  }
};

