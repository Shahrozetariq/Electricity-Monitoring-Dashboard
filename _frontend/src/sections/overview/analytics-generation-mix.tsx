import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader } from '@mui/material';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const GenerationMixChart: React.FC = () => {
    // Dummy data
    const data = {
        labels: ['Solar', 'Gen Sets', 'Power Grid'],
        datasets: [
            {
                label: 'Generation Mix (MW)',
                data: [30, 20, 50], // Example data in MW
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

    // Calculate total generation
    const totalGeneration = data.datasets[0].data.reduce((sum, value) => sum + value, 0);

    // Custom plugin to display total in the center
    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: (chart: ChartJS) => {
            const { ctx, chartArea } = chart;
            const { width, height } = chartArea;

            // Restore the context state
            ctx.restore();

            // Set font properties
            const fontSize = 16; // Base font size
            const lineHeight = fontSize * 1.2; // Line height for spacing
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';

            // Calculate text position
            const textX = Math.round((chartArea.left + chartArea.right) / 2);
            const textY = Math.round((chartArea.top + chartArea.bottom) / 2);

            // Draw "Total" text
            ctx.fillText('Total', textX, textY - lineHeight / 2);

            // Draw the total value with "MW"
            ctx.font = `bold ${fontSize}px sans-serif`; // Make the value bold
            ctx.fillText(`${totalGeneration} MW`, textX, textY + lineHeight / 2);

            // Save the context state
            ctx.save();
        },
    };
    return (
        <Card style={{ width: '100%', height: '500px', marginBottom: '40px' }}>
            <CardHeader title="Generation Mix" />
            <div style={{
                width: '400px', height: '400px', marginTop: '10px'
            }}>
                <Doughnut
                    data={data}
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



export default GenerationMixChart;;