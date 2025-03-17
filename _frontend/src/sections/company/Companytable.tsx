import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Company } from "./company";



interface BlockLookup {
    block_id: number;
    block_name: string;
}

interface Props {
    companies: Company[];
    blocks: BlockLookup[];
    onEdit: (company: Company) => void;
    onDelete: (id: number) => void;
}

const CompanyTable: React.FC<Props> = ({ companies, blocks, onEdit, onDelete }) => {
    // Helper function to find block name by ID
    const findBlockName = (id: number) => blocks.find((b) => b.block_id === id)?.block_name || "Unknown";

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Company Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Block</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {companies.map((company) => (
                        <TableRow key={company.company_id}>
                            <TableCell>{company.company_id}</TableCell>
                            <TableCell>{company.company_name}</TableCell>
                            <TableCell>{company.company_address}</TableCell>
                            <TableCell>{company.company_type}</TableCell>
                            <TableCell>{findBlockName(company.block_id)}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => onEdit(company)}>
                                    <EditIcon color="primary" />
                                </IconButton>
                                <IconButton onClick={() => company.company_id && onDelete(company.company_id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CompanyTable;
