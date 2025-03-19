import React, { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    type Node,
    type Edge,
    type OnConnect,
} from '@xyflow/react';
import { FiFile } from 'react-icons/fi';

import '@xyflow/react/dist/base.css';

import TurboNode, { type TurboNodeData } from './turbonode';
import TurboEdge from './turboedge';
import FunctionIcon from './icon';
import './flow.css';


const initialNodes: Node<TurboNodeData>[] = [
    { id: '1', position: { x: 0, y: 100 }, data: { icon: <FunctionIcon />, title: 'Solar Meter' }, type: 'turbo' },
    { id: '2', position: { x: 0, y: 200 }, data: { icon: <FunctionIcon />, title: 'Gen Sets' }, type: 'turbo' },
    { id: '3', position: { x: 0, y: 300 }, data: { icon: <FunctionIcon />, title: 'Main Grid' }, type: 'turbo' },
    { id: '4', position: { x: 300, y: 200 }, data: { icon: <FunctionIcon />, title: 'NASTP Delta' }, type: 'turbo' },
    { id: 'D1', position: { x: 600, y: 50 }, data: { icon: <FunctionIcon />, title: 'Delta 1' }, type: 'turbo' },
    { id: 'D2', position: { x: 600, y: 100 }, data: { icon: <FunctionIcon />, title: 'Delta 2' }, type: 'turbo' },
    { id: 'D3', position: { x: 600, y: 150 }, data: { icon: <FunctionIcon />, title: 'Delta 3' }, type: 'turbo' },
    { id: 'D4', position: { x: 600, y: 200 }, data: { icon: <FunctionIcon />, title: 'Delta 4' }, type: 'turbo' },
    { id: 'D5', position: { x: 600, y: 250 }, data: { icon: <FunctionIcon />, title: 'Delta 5' }, type: 'turbo' },
    { id: 'D6', position: { x: 600, y: 300 }, data: { icon: <FunctionIcon />, title: 'Delta 6' }, type: 'turbo' },
    { id: 'D7', position: { x: 600, y: 350 }, data: { icon: <FunctionIcon />, title: 'Delta 7' }, type: 'turbo' },
];


const initialEdges: Edge[] = [
    { id: 'e1-4', source: '1', target: '4' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e4-D1', source: '4', target: 'D1' },
    { id: 'e4-D2', source: '4', target: 'D2' },
    { id: 'e4-D3', source: '4', target: 'D3' },
    { id: 'e4-D4', source: '4', target: 'D4' },
    { id: 'e4-D5', source: '4', target: 'D5' },
    { id: 'e4-D6', source: '4', target: 'D6' },
    { id: 'e4-D7', source: '4', target: 'D7' },
];

const nodeTypes = {
    turbo: TurboNode,
};

const edgeTypes = {
    turbo: TurboEdge,
};

const defaultEdgeOptions = {
    type: 'turbo',
    markerEnd: 'edge-circle',
};

const Flow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((els) => addEdge(params, els)),
        [setEdges], // Include setEdges in the dependency array
    );
    return (
        <div style={{
            width: '100%', height: '100vh', position: 'relative',
            borderRadius: '16px', // Add rounded corners
            overflow: 'hidden', // Ensure child elements respect the rounded corners
        }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                defaultEdgeOptions={defaultEdgeOptions}
            >
                <Controls showInteractive={false} />
                <svg>
                    <defs>
                        <linearGradient id="edge-gradient">
                            <stop offset="0%" stopColor="#ae53ba" />
                            <stop offset="100%" stopColor="#2a8af6" />
                        </linearGradient>
                        <marker
                            id="edge-circle"
                            viewBox="-5 -5 10 10"
                            refX="0"
                            refY="0"
                            markerUnits="strokeWidth"
                            markerWidth="10"
                            markerHeight="10"
                            orient="auto"
                        >
                            <circle stroke="#2a8af6" strokeOpacity="0.75" r="2" cx="0" cy="0" />
                        </marker>
                    </defs>
                </svg>
            </ReactFlow>
        </div>
    );
};

export default Flow;
