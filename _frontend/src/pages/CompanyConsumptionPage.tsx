import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Box,
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface CompanyUsage {
    company_name: string;
    total_consumption: string;
}

const CompanyConsumptionPage: React.FC = () => {
    const [usageData, setUsageData] = useState<CompanyUsage[]>([]);

    useEffect(() => {
        fetchCompanyUsage();
    }, []);

    const fetchCompanyUsage = async () => {
        try {
            const response = await axios.get<CompanyUsage[]>('http://localhost:5000/api/company_usage');
            setUsageData(response.data);
        } catch (error) {
            console.error('Error fetching company usage data:', error);
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(usageData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CompanyUsage');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const fileData = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(fileData, 'CompanyUsage.xlsx');
    };

    return (
        <Container>
            <Box display="flex" justifyContent="space-between" alignItems="center" my={3}>
                <Typography variant="h4">Company Usage Report</Typography>
                <Button variant="contained" color="primary" onClick={exportToExcel}>
                    Export to Excel
                </Button>
            </Box>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Company Name</TableCell>
                        <TableCell>Total Consumption (kWh)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {usageData.map((company, index) => (
                        <TableRow key={index}>
                            <TableCell>{company.company_name}</TableCell>
                            <TableCell>{parseFloat(company.total_consumption).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Container>
    );
};



export default CompanyConsumptionPage;
