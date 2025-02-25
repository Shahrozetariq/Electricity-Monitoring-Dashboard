const EnergySource = require('../models/energySourceModel');

exports.getAllEnergySources = async (req, res) => {
    try {
        const energySources = await EnergySource.getAll();
        res.json(energySources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEnergySourceById = async (req, res) => {
    try {
        const energySource = await EnergySource.getById(req.params.id);
        if (!energySource) return res.status(404).json({ message: 'Energy source not found' });
        res.json(energySource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEnergySource = async (req, res) => {
    try {
        const energySourceId = await EnergySource.create(req.body);
        res.status(201).json({ energy_source_id: energySourceId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEnergySource = async (req, res) => {
    try {
        await EnergySource.update(req.params.id, req.body);
        res.json({ message: 'Energy source updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEnergySource = async (req, res) => {
    try {
        await EnergySource.delete(req.params.id);
        res.json({ message: 'Energy source deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
