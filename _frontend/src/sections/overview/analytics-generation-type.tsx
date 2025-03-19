import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader } from '@mui/material';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GenerationTypeChart: React.FC = () => {
    // Dummy data
    const data = {
        labels: ['Solar', 'Gen Sets', 'Power Grid'], // Generation types
        datasets: [
            {
                label: "Generation Types (MW)", // Label for the dataset
                data: [30, 20, 50], // Values for each generation type
                backgroundColor: [
                    'rgba(255, 206, 86, 0.8)', // Solar (Yellow)
                    'rgba(75, 192, 192, 0.8)', // Gen Sets (Teal)
                    'rgba(153, 102, 255, 0.8)', // Power Grid (Purple)
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

    // Chart options
    const options = {

        responsive: true,
        maintainAspectRatio: false, // Disable aspect ratio to control height and width independently
        plugins: {
            legend: {
                display: false,
                position: 'bottom' as const,
            },
            tooltip: {
                enabled: true,
            },
            title: {
                display: false,
                text: 'Generation Mix by Type (MW)', // Chart title
            },
        },
        scales: {
            y: {
                beginAtZero: true, // Start the y-axis from zero
                title: {
                    display: true,
                    text: 'Generation : Megawatts (MW)', // Y-axis label
                },

                grid: {
                    display: false, // Hide y-axis grid lines
                },
            },
            x: {
                title: {
                    display: false,
                    text: 'Generation Type', // X-axis label
                },
                grid: {
                    display: false, // Hide y-axis grid lines
                },
                barPercentage: 0.2, // Set bar width to 40% of the available space
                categoryPercentage: 0.8, // Adjust spacing between categories
            },
        },
    };

    return (
        <Card style={{ width: '100%', marginBottom: '40px' }}>
            <CardHeader title="Generation Mix by Type" />
            <div style={{ width: '400px', height: '450px', paddingBottom: '20px' }}>
                <Bar data={data} options={options} />
            </div>
        </Card>
    );
};


export default GenerationTypeChart;