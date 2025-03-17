// Date: 26/02/2025
import React, { useState, useEffect } from "react";
import { Button, Container, Typography } from "@mui/material";
import { Meter } from "src/sections/user/view/meters/meter";
import MeterTable from '../sections/user/view/meters/MeterTable';
import MeterForm from '../sections/user/view/meters/MeterForm';

import { getMeters, createMeter, updateMeter, deleteMeter, getEnergySources, getCompanies, getBlocks, updateMetersFromReadings } from "../sections/user/view/meters/MetersApi";


const MetersPage: React.FC = () => {
    const [meters, setMeters] = useState<Meter[]>([]);
    const [energySources, setEnergySources] = useState<{ energy_source_id: number; energy_source_name: string }[]>([]);
    const [companies, setCompanies] = useState<{ company_id: number; company_name: string }[]>([]);
    const [blocks, setBlocks] = useState<{ block_id: number; block_name: string }[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setMeters(await getMeters());
        setEnergySources(await getEnergySources());
        setCompanies(await getCompanies());
        setBlocks(await getBlocks());
    };

    const handleEdit = (meter: Meter) => {
        setSelectedMeter(meter);
        setOpenForm(true);
    };

    const handleDelete = async (id: number) => {
        await deleteMeter(id);
        fetchData();
    };

    const handleSubmit = async (meter: Meter) => {
        if (meter.meter_id) {
            await updateMeter(meter.meter_id, meter);
        } else {
            await createMeter(meter);
        }
        fetchData();
        setOpenForm(false);
        setSelectedMeter(null);
    };

    const handleUpdateMeters = async () => {
        try {
            const message = await updateMetersFromReadings();
            alert(message);
        } catch (error) {
            alert("Error: Unable to update meters");
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Meter Management</Typography>
            <Button variant="contained" color="primary" onClick={() => { handleUpdateMeters(); }}>
                Update Meters
            </Button>
            <MeterTable
                meters={meters}
                energySources={energySources}
                companies={companies}
                blocks={blocks}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            <MeterForm open={openForm} onClose={() => setOpenForm(false)} onSubmit={handleSubmit} meter={selectedMeter} />
        </Container>
    );
};

export default MetersPage;
