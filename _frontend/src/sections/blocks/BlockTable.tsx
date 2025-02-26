import React from "react";
import { Block } from "./block";
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

interface Props {
    blocks: Block[];
    onEdit: (block: Block) => void;
    onDelete: (id: number) => void;
}

const BlockTable: React.FC<Props> = ({ blocks, onEdit, onDelete }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Block Name</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {blocks.map((block) => (
                        <TableRow key={block.block_id}>
                            <TableCell>{block.block_id}</TableCell>
                            <TableCell>{block.block_name}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => onEdit(block)}>
                                    <EditIcon color="primary" />
                                </IconButton>
                                <IconButton onClick={() => block.block_id && onDelete(block.block_id)}>
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

export default BlockTable;
