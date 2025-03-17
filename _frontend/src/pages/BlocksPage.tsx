import React, { useState, useEffect } from "react";
import { Button, Container, Typography } from "@mui/material";
import { getBlocks, createBlock, updateBlock, deleteBlock } from "../sections/blocks/blockApi";

import BlockTable from "../sections/blocks/BlockTable";
import BlockForm from "../sections/blocks/BlockForm";
import { Block } from "../sections/blocks/block";


const BlocksPage: React.FC = () => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setBlocks(await getBlocks());
    };

    const handleEdit = (block: Block) => {
        setSelectedBlock(block);
        setOpenForm(true);
    };

    const handleDelete = async (id: number) => {
        await deleteBlock(id);
        fetchData();
    };

    const handleSubmit = async (block: Block) => {
        if (block.block_id) {
            await updateBlock(block.block_id, block);
        } else {
            await createBlock(block);
        }
        fetchData();
        setOpenForm(false);
        setSelectedBlock(null);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Block Management</Typography>
            <Button variant="contained" color="primary" onClick={() => { setSelectedBlock(null); setOpenForm(true); }}>
                Add Block
            </Button>
            <BlockTable blocks={blocks} onEdit={handleEdit} onDelete={handleDelete} />
            <BlockForm open={openForm} onClose={() => setOpenForm(false)} onSubmit={handleSubmit} block={selectedBlock} />
        </Container>
    );
};

export default BlocksPage;
