const Block = require('../models/blockModel');

exports.getAllBlocks = async (req, res) => {
    try {
        const blocks = await Block.getAll();
        res.json(blocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBlockById = async (req, res) => {
    try {
        const block = await Block.getById(req.params.id);
        if (!block) return res.status(404).json({ message: 'Block not found' });
        res.json(block);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createBlock = async (req, res) => {
    try {
        const blockId = await Block.create(req.body);
        res.status(201).json({ block_id: blockId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBlock = async (req, res) => {
    try {
        await Block.update(req.params.id, req.body);
        res.json({ message: 'Block updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBlock = async (req, res) => {
    try {
        await Block.delete(req.params.id);
        res.json({ message: 'Block deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
