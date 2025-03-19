const Company = require('../models/companyModel');

exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.getAll();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.getById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCompany = async (req, res) => {
    try {
        const companyId = await Company.create(req.body);
        res.status(201).json({ company_id: companyId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCompany = async (req, res) => {
    try {
        await Company.update(req.params.id, req.body);
        res.json({ message: 'Company updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        await Company.delete(req.params.id);
        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
