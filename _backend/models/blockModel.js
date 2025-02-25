const db = require('../config/db');

class Block {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM blocks');
        return rows;
    }

    static async getById(block_id) {
        const [rows] = await db.query('SELECT * FROM blocks WHERE block_id = ?', [block_id]);
        return rows[0];
    }

    static async create(data) {
        const { block_name } = data;
        const [result] = await db.query('INSERT INTO blocks (block_name) VALUES (?)', [block_name]);
        return result.insertId;
    }

    static async update(block_id, data) {
        const { block_name } = data;
        await db.query('UPDATE blocks SET block_name = ? WHERE block_id = ?', [block_name, block_id]);
        return true;
    }

    static async delete(block_id) {
        await db.query('DELETE FROM blocks WHERE block_id = ?', [block_id]);
        return true;
    }
}

module.exports = Block;
