const db = require('../config/db');

class Meter {
    static async getAll() {
        // console.log(rows);
        const [rows] = await db.query('SELECT * FROM meters');

        return rows;
    }

    static async getById(meter_id) {
        const [rows] = await db.query('SELECT * FROM meters WHERE meter_id = ?', [meter_id]);
        return rows[0];
    }

    static async create(data) {
        const { meter_name, meter_type, energy_source_id, company_id, block_id } = data;
        const [result] = await db.query('INSERT INTO meters (meter_name, meter_type, energy_source_id, company_id, block_id) VALUES (?, ?, ?, ?, ?)', [meter_name, meter_type, energy_source_id, company_id, block_id]);
        return result.insertId;
    }

    static async update(meter_id, data) {
        const { meter_name, meter_type, energy_source_id, company_id, block_id } = data;
        await db.query('UPDATE meters SET meter_name = ?, meter_type = ?, energy_source_id = ?, company_id = ?, block_id = ? WHERE meter_id = ?', [meter_name, meter_type, energy_source_id, company_id, block_id, meter_id]);
        return true;
    }

    static async delete(meter_id) {
        await db.query('DELETE FROM meters WHERE meter_id = ?', [meter_id]);
        return true;
    }

    static async updateFromReadings() {
        await db.query("CALL AddMetersFromReadings()");
        return true;
    }
}

module.exports = Meter;
