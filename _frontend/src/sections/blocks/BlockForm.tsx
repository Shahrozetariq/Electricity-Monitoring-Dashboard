import React, { useState, useEffect } from "react";

import {
    TextField,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from "@mui/material";
import { Block } from "./block";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (block: Block) => void;
    block?: Block | null;
}

const BlockForm: React.FC<Props> = ({ open, onClose, onSubmit, block }) => {
    const [formData, setFormData] = useState<Block>({
        block_name: "",
    });

    useEffect(() => {
        if (block) {
            setFormData(block);
        } else {
            setFormData({ block_name: "" });
        }
    }, [block]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, block_name: e.target.value });
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{block ? "Edit Block" : "Add Block"}</DialogTitle>
            <DialogContent>
                <TextField label="Block Name" name="block_name" fullWidth margin="normal" value={formData.block_name} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BlockForm;
