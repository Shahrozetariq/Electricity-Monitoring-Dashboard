import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader, MenuItem, Select, SelectChangeEvent, FormControl } from '@mui/material';
import axios from 'axios'; // For making the API call

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GenerationTypeChart: React.FC = () => {
    const [generationData, setGenerationData] = useState<number[]>([0, 0, 0]);
    const [totalGeneration, setTotalGeneration] = useState<number>(0);
    const [selectedInterval, setSelectedInterval] = useState<string>('1'); // Default to last 1 hour

    // API call to fetch real generation type consumption
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://182.180.69.171/bck//api/sourcetypeconsumption?hours=${selectedInterval}`);
                const data = response.data;

                // Initialize consumption object with default values
                type EnergySource = 'Grid' | 'Solar' | 'Genset';

                const consumption: Record<EnergySource, number> = {
                    Grid: 0,
                    Solar: 0,
                    Genset: 0,
                };

                data.forEach((item: { energy_source: string; total_consumption: string }) => {
                    const source = item.energy_source as EnergySource;
                    if (source in consumption) {
                        consumption[source] = parseFloat(item.total_consumption);
                    }
                });

                // Update generation data array
                const updatedGenerationData = [
                    consumption.Solar,
                    consumption.Genset,
                    consumption.Grid,
                ];

                // Calculate total generation
                const total = updatedGenerationData.reduce((sum, value) => sum + value, 0);

                setGenerationData(updatedGenerationData);
                setTotalGeneration(total);
            } catch (error) {
                console.error('Error fetching generation mix data:', error);
            }
        };

        fetchData();
    }, [selectedInterval]); // Refetch data when selectedInterval changes

    // Handle dropdown selection change
    const handleIntervalChange = (event: SelectChangeEvent) => {
        setSelectedInterval(event.target.value);
    };

    // Chart data object (dynamically updated based on API response)
    const chartData = {
        labels: ['Solar', 'Genset', 'Grid'], // Labels for the bars
        datasets: [
            {
                label: 'Generation Types (MW)', // Dataset label
                data: generationData, // Data fetched from the API
                backgroundColor: [
                    'rgba(255, 206, 86, 0.8)', // Solar (Yellow)
                    'rgba(75, 192, 192, 0.8)', // Genset (Teal)
                    'rgba(153, 102, 255, 0.8)', // Grid (Purple)
                ],
                borderColor: [
                    'rgb(158, 128, 53)',
                    'rgb(42, 104, 104)',
                    'rgb(82, 55, 138)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Chart options for better visualization
    const options = {
        responsive: true,
        maintainAspectRatio: false, // Allow custom width and height
        plugins: {
            legend: {
                display: false, // Disable legend (if desired)
                position: 'bottom' as const,
            },
            tooltip: {
                enabled: true,
            },
            title: {
                display: false,
                text: 'Generation Mix by Type (MW)',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Generation: Megawatts (MW)',
                },
                grid: {
                    display: false,
                },
            },
            x: {
                title: {
                    display: false,
                    text: 'Generation Type',
                },
                grid: {
                    display: false,
                },
                barPercentage: 0.4, // Adjust bar width
                categoryPercentage: 0.8, // Adjust space between bars
            },
        },
    };

    return (
        <Card style={{ width: '100%', marginBottom: '40px' }}>
            <CardHeader
                title="Generation Mix by Type"
                action={
                    <FormControl size="small" variant="outlined">
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
                }
            />
            <div style={{ width: '400px', height: '450px', paddingBottom: '20px' }}>
                <Bar data={chartData} options={options} />
            </div>
        </Card>
    );
};

export default GenerationTypeChart;