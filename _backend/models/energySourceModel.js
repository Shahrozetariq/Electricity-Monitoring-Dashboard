const db = require('../config/db');

class EnergySource {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM energy_sources');
        return rows;
    }

    static async getById(energy_source_id) {
        const [rows] = await db.query('SELECT * FROM energy_sources WHERE energy_source_id = ?', [energy_source_id]);
        return rows[0];
    }

    static async create(data) {
        const { energy_source_name } = data;
        const [result] = await db.query(
            'INSERT INTO energy_sources (energy_source_name) VALUES (?)',
            [energy_source_name]
        );
        return result.insertId;
    }

    static async update(energy_source_id, data) {
        const { energy_source_name } = data;
        await db.query(
            'UPDATE energy_sources SET energy_source_name = ? WHERE energy_source_id = ?',
            [energy_source_name, energy_source_id]
        );
        return true;
    }

    static async delete(energy_source_id) {
        await db.query('DELETE FROM energy_sources WHERE energy_source_id = ?', [energy_source_id]);
        return true;
    }
}

module.exports = EnergySource;
