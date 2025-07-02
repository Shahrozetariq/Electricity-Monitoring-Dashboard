import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { Card, CardHeader, MenuItem, Select, SelectChangeEvent, FormControl } from '@mui/material';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const GenerationMixChart: React.FC = () => {
    const [generationData, setGenerationData] = useState<number[]>([0, 0, 0]);
    const [totalGeneration, setTotalGeneration] = useState<number>(0);
    const [selectedInterval, setSelectedInterval] = useState<string>('1'); // Default to last 1 hour

    // API call to fetch combined consumption data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://182.180.69.171/bck//api/sourcetypeconsumption?hours=${selectedInterval}`);
                const data = response.data;


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
                // Initialize consumption object with default values
                // const consumption = {
                //     Grid: 0,
                //     Solar: 0,
                //     Genset: 0,
                // };

                // // Map the fetched data to consumption values based on energy source
                // data.forEach((item: { energy_source: string; total_consumption: string }) => {
                //     if (consumption[item.energy_source] !== undefined) {
                //         consumption[item.energy_source] = parseFloat(item.total_consumption); // Convert string to number
                //     }
                // });

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

    // Conditionally handle the chart data
    const chartData = totalGeneration > 0
        ? {
            labels: ['Solar', 'Genset', 'Grid'],
            datasets: [
                {
                    label: 'Generation Mix (MW)',
                    data: generationData,
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
        }
        : {
            labels: ['No Data'], // Placeholder for empty donut
            datasets: [
                {
                    label: 'No Generation',
                    data: [1], // Fake value for an empty chart
                    backgroundColor: ['rgba(211, 211, 211, 0.5)'], // Light gray color for empty chart
                    borderColor: ['rgba(169, 169, 169, 1)'],
                    borderWidth: 1,
                },
            ],
        };

    // Custom plugin to display total in the center of the chart
    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: (chart: ChartJS) => {
            const { ctx, chartArea } = chart;
            ctx.restore();

            // Set font properties
            const fontSize = 16;
            const lineHeight = fontSize * 1.2;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';

            const textX = Math.round((chartArea.left + chartArea.right) / 2);
            const textY = Math.round((chartArea.top + chartArea.bottom) / 2);

            if (totalGeneration > 0) {
                ctx.fillText('Total', textX, textY - lineHeight / 2);
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.fillText(`${totalGeneration.toFixed(2)} MW`, textX, textY + lineHeight / 2);
            } else {
                ctx.fillText('No Data', textX, textY);
            }

            ctx.save();
        },
    };

    return (
        <Card style={{ width: '100%', height: '500px', marginBottom: '40px' }}>
            <CardHeader
                title="Generation Mix"
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
            <div style={{ width: '400px', height: '400px', marginTop: '10px' }}>
                <Doughnut

                    key={totalGeneration} // Re-render the chart when totalGeneration changes
                    data={chartData}
                    plugins={[centerTextPlugin]}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            },
                            tooltip: {
                                enabled: true,
                            },
                        },
                    }}
                />
            </div>
        </Card>
    );
};

export default GenerationMixChart;