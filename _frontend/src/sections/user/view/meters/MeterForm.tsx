import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    SelectChangeEvent,
} from "@mui/material";

import { Meter } from "./meter";
import { getEnergySources, getCompanies, getBlocks, getMeterTypes } from "./MetersApi";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (meter: Meter) => void;
    meter?: Meter | null;
    types: { type_id: number; type: string }[];

}

const MeterForm: React.FC<Props> = ({ open, onClose, onSubmit, meter }) => {
    const [formData, setFormData] = useState<Meter>({
        meter_name: "",
        meter_type: 0,
        energy_source_id: 0,
        company_id: 0,
        block_id: 0,
    });

    const [energySources, setEnergySources] = useState<{ energy_source_id: number; energy_source_name: string }[]>([]);
    const [companies, setCompanies] = useState<{ company_id: number; company_name: string }[]>([]);
    const [blocks, setBlocks] = useState<{ block_id: number; block_name: string }[]>([]);
    const [meterTypes, setMeterTypes] = useState<{ type_id: number; type: string }[]>([]);

    useEffect(() => {
        if (meter) {
            setFormData(meter);
        } else {
            setFormData({
                meter_name: "",
                meter_type: 0,
                energy_source_id: 0,
                company_id: 0,
                block_id: 0,
            });
        }
    }, [meter]);

    useEffect(() => {
        async function fetchLookups() {
            setEnergySources(await getEnergySources());
            setCompanies(await getCompanies());
            setBlocks(await getBlocks());
            setMeterTypes(await getMeterTypes()); // Fetch meter types from the API
        }
        fetchLookups();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<{ name?: string; value: unknown }> | SelectChangeEvent<number>
    ) => {
        const { name, value } = e.target;
        if (name) {
            setFormData({ ...formData, [name]: value as string | number });
        }
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{meter ? "Edit Meter" : "Add Meter"}</DialogTitle>
            <DialogContent>
                <TextField label="Meter Name" name="meter_name" fullWidth margin="normal" value={formData.meter_name} onChange={handleChange} />

                {/* Meter Type Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Meter Type</InputLabel>
                    <Select name="meter_type" value={formData.meter_type} onChange={handleChange}>
                        {meterTypes.map((type) => (
                            <MenuItem key={type.type_id} value={type.type_id}>
                                {type.type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Energy Source Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Energy Source</InputLabel>
                    <Select name="energy_source_id" value={formData.energy_source_id} onChange={handleChange}>
                        {energySources.map((source) => (
                            <MenuItem key={source.energy_source_id} value={source.energy_source_id}>
                                {source.energy_source_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Company Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Company</InputLabel>
                    <Select name="company_id" value={formData.company_id} onChange={handleChange}>
                        {companies.map((company) => (
                            <MenuItem key={company.company_id} value={company.company_id}>
                                {company.company_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Block Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Block</InputLabel>
                    <Select name="block_id" value={formData.block_id} onChange={handleChange}>
                        {blocks.map((block) => (
                            <MenuItem key={block.block_id} value={block.block_id}>
                                {block.block_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default MeterForm;