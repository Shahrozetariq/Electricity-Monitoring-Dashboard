import React from "react";
import { Meter } from "../types/meter";
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

interface Lookup {
    energy_source_id: number;
    energy_source_name: string;
}

interface CompanyLookup {
    company_id: number;
    company_name: string;
}

interface BlockLookup {
    block_id: number;
    block_name: string;
}

interface Props {
    meters: Meter[];
    energySources: Lookup[];
    companies: CompanyLookup[];
    blocks: BlockLookup[];
    onEdit: (meter: Meter) => void;
    onDelete: (id: number) => void;
}

const MeterTable: React.FC<Props> = ({ meters, energySources, companies, blocks, onEdit, onDelete }) => {
    // Helper function to find lookup name by ID


    const findEnergySourceName = (id: number) => energySources.find((e) => e.energy_source_id === id)?.energy_source_name || "-";
    const findCompanyName = (id: number) => companies.find((c) => c.company_id === id)?.company_name || "-";
    const findBlockName = (id: number) => blocks.find((b) => b.block_id === id)?.block_name || "-";

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Meter Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Energy Source</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Block</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {meters.map((meter) => (
                        <TableRow key={meter.meter_id}>
                            <TableCell>{meter.meter_id}</TableCell>
                            <TableCell>{meter.meter_name}</TableCell>
                            <TableCell>{meter.meter_type}</TableCell>
                            <TableCell>{findEnergySourceName(meter.energy_source_id)}</TableCell>
                            <TableCell>{findCompanyName(meter.company_id)}</TableCell>
                            <TableCell>{findBlockName(meter.block_id)}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => onEdit(meter)}>
                                    <EditIcon color="primary" />
                                </IconButton>
                                <IconButton onClick={() => meter.meter_id && onDelete(meter.meter_id)}>
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

export default MeterTable;
