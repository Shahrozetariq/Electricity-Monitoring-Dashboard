import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, MenuItem, Select, SelectChangeEvent, FormControl } from '@mui/material';
import './ConsumptionMixChart.css'; // Import custom CSS for styling

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ConsumptionMixChart: React.FC = () => {
    const [deltaConsumption, setDeltaConsumption] = useState<number[]>([]);
    const [blockLabels, setBlockLabels] = useState<string[]>([]);
    const [totalConsumption, setTotalConsumption] = useState(0);
    const [selectedInterval, setSelectedInterval] = useState<string>('1'); // Default to last 1 hour
    const [blocks, setBlocks] = useState<{ block_id: number; block_name: string }[]>([]);

    // Fetch block data
    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await axios.get('http://182.180.69.171/bck//api/blocks');
                setBlocks(response.data);
            } catch (error) {
                console.error('Error fetching block data:', error);
            }
        };

        fetchBlocks();
    }, []);

    // Fetch Delta meters consumption data based on selected interval
    // Fetch Delta meters consumption data based on selected interval
    useEffect(() => {
        const fetchDeltaConsumption = async () => {
            try {
                const response = await axios.get(`http://182.180.69.171/bck//api/delta_consumption?hours=${selectedInterval}`);
                const consumptionData = response.data;

                if (consumptionData && consumptionData.length > 0) {
                    // Map block names to consumption data
                    const values = consumptionData.map((block: any) => block.total_consumption);
                    const labels = consumptionData.map((block: any) => {
                        const blockInfo = blocks.find((b) => b.block_id === block.block_id);
                        return blockInfo ? blockInfo.block_name : `Block ${block.block_id}`;
                    });

                    setDeltaConsumption(values);
                    setBlockLabels(labels);

                    // Calculate total consumption in MW
                    const totalConsumptionKW = values.reduce((sum: number, value: number) => {
                        console.log(value, "each Value", sum); // Debug: Log each value and the current sum
                        return Number(sum) + Number(value); // Return the accumulated sum
                    }, 0); // Sum in kW

                    console.log(totalConsumptionKW, "1st");
                    const totalConsumptionMW = totalConsumptionKW / 1000000; // Convert to MW
                    console.log(totalConsumptionKW, "2nd");
                    setTotalConsumption(totalConsumptionMW); // Set total consumption in MW
                    console.log(totalConsumption, "final");

                } else {
                    setDeltaConsumption([]);
                    setBlockLabels([]);
                    setTotalConsumption(0);
                }
            } catch (error) {
                console.error('Error fetching Delta meters consumption:', error);
            }
        };

        fetchDeltaConsumption();
    }, [selectedInterval, blocks]); // Refetch data when selectedInterval or blocks change
    // Handle dropdown selection change
    const handleIntervalChange = (event: SelectChangeEvent) => {
        setSelectedInterval(event.target.value);
    };

    const data = {
        labels: blockLabels.length ? blockLabels : ['No Data'],
        datasets: [
            {
                label: 'Consumption Mix (MW)',
                data: deltaConsumption.length ? deltaConsumption : [1],
                backgroundColor: deltaConsumption.length
                    ? [
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                    ]
                    : ['rgba(200, 200, 200, 0.5)'],
                borderColor: deltaConsumption.length
                    ? ['rgb(158, 128, 53)', 'rgb(42, 104, 104)', 'rgb(82, 55, 138)', 'rgb(158, 53, 53)']
                    : ['rgba(150, 150, 150, 1)'],
                borderWidth: 1,
            },
        ],
    };

    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: (chart: ChartJS) => {
            const { ctx, chartArea } = chart;
            const { width, height } = chartArea;
            ctx.restore();
            const fontSize = 16;
            const lineHeight = fontSize * 1.2;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            const textX = Math.round((chartArea.left + chartArea.right) / 2);
            const textY = Math.round((chartArea.top + chartArea.bottom) / 2);
            ctx.fillText('Total', textX, textY - lineHeight / 2);
            ctx.font = `bold ${fontSize}px sans-serif`;
            console.log(totalConsumption, "Output total");
            ctx.fillText(`${Number(totalConsumption) > 0 ? `${totalConsumption.toFixed(2)} MW` : 'No Data'}`, textX, textY + lineHeight / 2);
            ctx.save();
        },
    };

    return (
        <Card style={{ width: '100%', height: '500px', marginBottom: '40px' }}>
            <div className="header-container">
                <h4>Consumption Mix: Delta's</h4>
                <FormControl size="small" variant="outlined" className="dropdown">
                    <Select
                        value={selectedInterval}
                        onChange={handleIntervalChange}
                    >
                        <MenuItem value="1">Last 1 Hour</MenuItem>
                        <MenuItem value="12">Last 12 Hours</MenuItem>
                        <MenuItem value="24">Last 24 Hours</MenuItem>
                        <MenuItem value="48">Last 48 Hours</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <div style={{ width: '400px', height: '400px', marginTop: '10px' }}>
                <Doughnut
                    key={totalConsumption}
                    data={data}
                    plugins={[centerTextPlugin]}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: { enabled: true },
                        },
                    }}
                />
            </div>
        </Card>
    );
};

export default ConsumptionMixChart;