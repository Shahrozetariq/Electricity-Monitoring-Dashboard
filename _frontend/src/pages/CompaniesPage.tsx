import React, { useState, useEffect } from "react";
import { Button, Container, Typography } from "@mui/material";

import { getCompanies, createCompany, updateCompany, deleteCompany, getBlocks } from "../sections/company/companiesApi";
import CompanyTable from "../sections/company/Companytable";
import CompanyForm from "../sections/company/CompanyForm";
import { Company } from "../sections/company/company";

const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [blocks, setBlocks] = useState<{ block_id: number; block_name: string }[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setCompanies(await getCompanies());
        setBlocks(await getBlocks());
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setOpenForm(true);
    };

    const handleDelete = async (id: number) => {
        await deleteCompany(id);
        fetchData();
    };

    const handleSubmit = async (company: Company) => {
        if (company.company_id) {
            await updateCompany(company.company_id, company);
        } else {
            await createCompany(company);
        }
        fetchData();
        setOpenForm(false);
        setSelectedCompany(null);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Company Management</Typography>
            <Button variant="contained" color="primary" onClick={() => { setSelectedCompany(null); setOpenForm(true); }}>
                Add Company
            </Button>
            <CompanyTable
                companies={companies}
                blocks={blocks}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            <CompanyForm open={openForm} onClose={() => setOpenForm(false)} onSubmit={handleSubmit} company={selectedCompany} />
        </Container>
    );
};

export default CompaniesPage;
