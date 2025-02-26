import React, { useState, useEffect } from "react";
import { Company } from "../types/company";
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
    FormControl
} from "@mui/material";
import { getBlocks } from "./companiesApi";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (company: Company) => void;
    company?: Company | null;
}

const CompanyForm: React.FC<Props> = ({ open, onClose, onSubmit, company }) => {
    const [formData, setFormData] = useState<Company>({
        company_name: "",
        company_address: "",
        company_type: "",
        block_id: 0,
    });

    const [blocks, setBlocks] = useState<{ block_id: number; block_name: string }[]>([]);

    useEffect(() => {
        if (company) {
            setFormData(company);
        } else {
            setFormData({
                company_name: "",
                company_address: "",
                company_type: "",
                block_id: 0,
            });
        }
    }, [company]);

    useEffect(() => {
        async function fetchBlocks() {
            setBlocks(await getBlocks());
        }
        fetchBlocks();
    }, []);

    const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
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
            <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
            <DialogContent>
                <TextField label="Company Name" name="company_name" fullWidth margin="normal" value={formData.company_name} onChange={handleChange} />
                <TextField label="Address" name="company_address" fullWidth margin="normal" value={formData.company_address} onChange={handleChange} />
                <TextField label="Type" name="company_type" fullWidth margin="normal" value={formData.company_type} onChange={handleChange} />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Block</InputLabel>
                    <Select name="block_id" value={formData.block_id} onChange={handleChange}>
                        {blocks.map((block) => (
                            <MenuItem key={block.block_id} value={block.block_id}>{block.block_name}</MenuItem>
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

export default CompanyForm;
