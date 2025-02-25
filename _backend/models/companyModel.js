const db = require('../config/db');

class Company {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM companies');
        return rows;
    }

    static async getById(company_id) {
        const [rows] = await db.query('SELECT * FROM companies WHERE company_id = ?', [company_id]);
        return rows[0];
    }

    static async create(data) {
        const { company_name, company_address, company_type, block_id } = data;
        const [result] = await db.query(
            'INSERT INTO companies (company_name, company_address, company_type, block_id) VALUES (?, ?, ?, ?)',
            [company_name, company_address, company_type, block_id]
        );
        return result.insertId;
    }

    static async update(company_id, data) {
        const { company_name, company_address, company_type, block_id } = data;
        await db.query(
            'UPDATE companies SET company_name = ?, company_address = ?, company_type = ?, block_id = ? WHERE company_id = ?',
            [company_name, company_address, company_type, block_id, company_id]
        );
        return true;
    }

    static async delete(company_id) {
        await db.query('DELETE FROM companies WHERE company_id = ?', [company_id]);
        return true;
    }
}

module.exports = Company;
