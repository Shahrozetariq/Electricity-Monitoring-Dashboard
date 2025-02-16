import { useState } from 'react';
import ReactFlow, {
    Controls,
    Background,
    Node,
    Edge,
    ConnectionMode
} from 'react-flow-renderer';
import Box from '@mui/material/Box'; // MUI v6 Box
import Grid from '@mui/material/Unstable_Grid2'; // MUI v6 Grid
import Typography from '@mui/material/Typography'; // MUI v6 Typography
import Button from '@mui/material/Button'; // MUI v6 Button
import SolarPowerIcon from '@mui/icons-material/SolarPower'; // MUI v6 Icon
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt'; // MUI v6 Icon
import GridViewIcon from '@mui/icons-material/GridView'; // MUI v6 Icon

// Define the type for custom nodes
type CustomNode = Node & {
    data: {
        label: React.ReactNode;
        value?: number;
    };
};

// Initial nodes for the flow diagram
const initialNodes: CustomNode[] = [
    {
        id: 'solar',
        type: 'input',
        data: {
            label: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SolarPowerIcon fontSize="large" color="primary" /> Solar
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Value: 100
                    </Typography>
                </Box>
            ),
            value: 100, // Example value for Solar
        },
        position: { x: 50, y: 50 },
        draggable: false
    },
    {
        id: 'generator',
        type: 'input',
        data: {
            label: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ElectricBoltIcon fontSize="large" color="secondary" /> Generator
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Value: 50
                    </Typography>
                </Box>
            ),
            value: 50, // Example value for Generator
        },
        position: { x: 50, y: 200 },
        draggable: false
    },
    {
        id: 'grid',
        type: 'input',
        data: {
            label: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GridViewIcon fontSize="large" color="success" /> Grid
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Value: 75
                    </Typography>
                </Box>
            ),
            value: 75, // Example value for Grid
        },
        position: { x: 50, y: 350 },
        draggable: false
    },
    {
        id: 'nastp',
        type: 'output',
        data: {
            label: (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        NASTP
                    </Typography>
                </Box>
            ),
        },
        position: { x: 500, y: 200 },
        draggable: false
    },
];

// Initial edges for the flow diagram
const initialEdges: Edge[] = [
    { id: 'solar-nastp', source: 'solar', target: 'nastp', animated: false, type: 'straight', style: { strokeWidth: 2 } },
    { id: 'generator-nastp', source: 'generator', target: 'nastp', animated: false, type: 'straight', style: { strokeWidth: 2 } },
    { id: 'grid-nastp', source: 'grid', target: 'nastp', animated: false, type: 'straight', style: { strokeWidth: 2 } },
];

// Electricity Flow Diagram Component
export function ElectricityFlowDiagram() {
    const [nodes, setNodes] = useState<CustomNode[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [activeSource, setActiveSource] = useState<string | null>(null);

    // Function to update the flow animation based on the selected source
    const startFlow = (sourceId: string) => {
        setActiveSource(sourceId);

        const updatedEdges = edges.map(edge => {
            if (edge.source === sourceId) {
                return {
                    ...edge,
                    animated: true,
                    style: {
                        stroke: 'url(#gradient)', // Gradient effect for current flow
                        strokeWidth: 4,
                    },
                };
            }
            return { ...edge, animated: false, style: { strokeWidth: 2 } }; // Reset other edges

        });

        setEdges(updatedEdges);
    };

    return (
        <Grid container spacing={3} sx={{ height: '600px', mt: 2 }}>
            <Grid xs={12}>
                <Typography variant="h5" gutterBottom>
                    Electricity Flow Diagram
                </Typography>
            </Grid>

            <Grid xs={12} sx={{ height: '500px', border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                {/* Gradient definition for current flow effect */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#ff0000', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#ffbb00', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                </svg>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    style={{ backgroundColor: '#f5f5f5' }}
                >
                    <Controls />
                    <Background color="#aaa" gap={16} />
                </ReactFlow>
            </Grid>

            <Grid xs={12} container justifyContent="center" spacing={2} sx={{ mt: 2 }}>
                <Grid>
                    <Button
                        variant="contained"
                        onClick={() => startFlow('solar')}
                        startIcon={<SolarPowerIcon />}
                    >
                        Start Solar Flow
                    </Button>
                </Grid>
                <Grid>
                    <Button
                        variant="contained"
                        onClick={() => startFlow('generator')}
                        startIcon={<ElectricBoltIcon />}
                    >
                        Start Generator Flow
                    </Button>
                </Grid>
                <Grid>
                    <Button
                        variant="contained"
                        onClick={() => startFlow('grid')}
                        startIcon={<GridViewIcon />}
                    >
                        Start Grid Flow
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
}