{/*import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const width = 1000;
const height = 600;

const sources = ['Grid', 'Solar', 'Genset'];
const blocks = ['Delta 1', 'Delta 2', 'Delta 3', 'Delta 4', 'Delta 5', 'Delta 6'];
const centralNode = 'Main Panel';

const sampleFlowData = {
    Grid: 1000,
    Solar: 600,
    Genset: 400,
    'Delta 1': 200,
    'Delta 2': 150,
    'Delta 3': 180,
    'Delta 4': 300,
    'Delta 5': 190,
    'Delta 6': 280,
};

const EnergyFlowGraph = () => {
    const [positions, setPositions] = useState<any>({});

    useEffect(() => {
        const nodes = [...sources, centralNode, ...blocks];
        const nodePositions: any = {};

        nodes.forEach((node, i) => {
            if (sources.includes(node)) {
                nodePositions[node] = { x: 100, y: 100 + i * 100 };
            } else if (node === centralNode) {
                nodePositions[node] = { x: width / 2, y: height / 2 };
            } else {
                nodePositions[node] = { x: width - 150, y: 100 + (i - sources.length - 1) * 80 };
            }
        });

        setPositions(nodePositions);
    }, []);

    const createFlowParticles = (source: string, target: string, count: number) => {
        const particles = [];
        const { x: x1, y: y1 } = positions[source] || {};
        const { x: x2, y: y2 } = positions[target] || {};

        for (let i = 0; i < count; i++) {
            const delay = i * 0.3;
            particles.push(
                <motion.circle
                    key={`${source}-${target}-particle-${i}`}
                    cx={x1}
                    cy={y1}
                    r={4}
                    fill="orange"
                    animate={{ cx: x2, cy: y2 }}
                    transition={{ repeat: Infinity, repeatType: 'loop', duration: 2, delay }}
                />
            );
        }
        return particles;
    };

    return (
        <svg width={width} height={height}>
            
            {Object.keys(positions).length > 0 && (
                <>
                   
                    {sources.map((src) => (
                        <line
                            key={`${src}-to-central`}
                            x1={positions[src].x}
                            y1={positions[src].y}
                            x2={positions[centralNode].x}
                            y2={positions[centralNode].y}
                            stroke="#aaa"
                            strokeWidth={2}
                        />
                    ))}

                  
                    {blocks.map((blk) => (
                        <line
                            key={`${centralNode}-to-${blk}`}
                            x1={positions[centralNode].x}
                            y1={positions[centralNode].y}
                            x2={positions[blk].x}
                            y2={positions[blk].y}
                            stroke="#1e88e5"
                            strokeWidth={2}
                        />
                    ))}

                   
                    {sources.flatMap((src) => createFlowParticles(src, centralNode, 5))}
                    {blocks.flatMap((blk) => createFlowParticles(centralNode, blk, 5))}

                 
                    {Object.entries(positions).map(([id, pos]: any) => (
                        <>
                           
                            <rect
                                key={`node-${id}`}
                                x={pos.x - 20}
                                y={pos.y - 20}
                                width={40}
                                height={40}
                                fill={sources.includes(id) ? '#43a047' : id === centralNode ? '#ffb300' : '#1e88e5'}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                       
                            <text x={pos.x} y={pos.y - 25} fontSize={14} fill="#333" textAnchor="middle">
                                {id}
                            </text>
                            {sampleFlowData[id] && (
                                <text x={pos.x} y={pos.y + 10} fontSize={12} fill="#666" textAnchor="middle">
                                    {sampleFlowData[id]} kWh
                                </text>
                            )}
                        </>
                    ))}
                </>
            )}
        </svg>
    );
};

export default EnergyFlowGraph;*/}


import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './EnergyFlowGraph.css';

const width = 1000;
const height = 600;

const sources = ['Grid', 'Solar', 'Genset'];
const blocks = ['Delta 1', 'Delta 2', 'Delta 3', 'Delta 4', 'Delta 5', 'Delta 6'];
const centralNode = 'Main Panel';

const sampleFlowData = {
    Grid: 1000,
    Solar: 600,
    Genset: 400,
    'Delta 1': 200,
    'Delta 2': 150,
    'Delta 3': 180,
    'Delta 4': 300,
    'Delta 5': 190,
    'Delta 6': 280,
};

const EnergyFlowGraph = () => {
    const [positions, setPositions] = useState<any>({});
    const particleRefs = useRef<any>([]);

    useEffect(() => {
        const nodes = [...sources, centralNode, ...blocks];
        const nodePositions: any = {};

        nodes.forEach((node, i) => {
            if (sources.includes(node)) {
                nodePositions[node] = { x: 150, y: 100 + i * 120 };
            } else if (node === centralNode) {
                nodePositions[node] = { x: width / 2, y: height / 2 };
            } else {
                nodePositions[node] = { x: width - 200, y: 60 + (i - sources.length - 1) * 80 };
            }
        });

        setPositions(nodePositions);
    }, []);

    useEffect(() => {
        // Animate particles
        particleRefs.current.forEach((ref: any) => {
            gsap.to(ref, {
                duration: 2,
                motionPath: {
                    path: ref.dataset.path,
                    align: ref.dataset.path,
                    autoRotate: false,
                },
                repeat: -1,
                ease: 'linear',
            });
        });
    }, [positions]);

    const renderLShape = (x1: number, y1: number, x2: number, y2: number) => {
        const midX = x1 < x2 ? x2 - 100 : x2 + 100;
        return `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`;
    };

    const renderFlowParticles = (source: string, target: string, count: number) => {
        const { x: x1, y: y1 } = positions[source] || {};
        const { x: x2, y: y2 } = positions[target] || {};

        const pathId = `${source}-${target}-path`;
        const pathD = renderLShape(x1, y1, x2, y2);

        return (
            <>
                <path id={pathId} d={pathD} fill="none" stroke="transparent" />
                {Array.from({ length: count }).map((_, i) => (
                    <circle
                        key={`${source}-${target}-particle-${i}`}
                        r={5}
                        fill="orange"
                        ref={(el) => (particleRefs.current.push(el))}
                        data-path={`#${pathId}`}
                        style={{ offsetPath: `path('${pathD}')`, offsetDistance: `${i * 20}%` }}
                    />
                ))}
            </>
        );
    };

    return (
        <div className="graph-wrapper">
            <svg width={width} height={height}>
                {/* Edges */}
                {Object.keys(positions).length > 0 && (
                    <>
                        {/* From Sources to Central */}
                        {sources.map((src) => {
                            const { x: x1, y: y1 } = positions[src];
                            const { x: x2, y: y2 } = positions[centralNode];
                            return (
                                <path
                                    key={`path-${src}-central`}
                                    d={renderLShape(x1, y1, x2, y2)}
                                    stroke="#bbb"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            );
                        })}

                        {/* From Central to Blocks */}
                        {blocks.map((blk) => {
                            const { x: x1, y: y1 } = positions[centralNode];
                            const { x: x2, y: y2 } = positions[blk];
                            return (
                                <path
                                    key={`path-central-${blk}`}
                                    d={renderLShape(x1, y1, x2, y2)}
                                    stroke="#2196F3"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            );
                        })}

                        {/* Particles */}
                        {sources.map((src) => renderFlowParticles(src, centralNode, 5))}
                        {blocks.map((blk) => renderFlowParticles(centralNode, blk, 5))}

                        {/* Nodes */}
                        {Object.entries(positions).map(([id, pos]: any) => (
                            <g key={id}>
                                <rect
                                    x={pos.x - 30}
                                    y={pos.y - 30}
                                    width={60}
                                    height={60}
                                    rx={12}
                                    fill={
                                        sources.includes(id)
                                            ? '#43a047'
                                            : id === centralNode
                                                ? '#fbc02d'
                                                : '#1e88e5'
                                    }
                                    stroke="#fff"
                                    strokeWidth={2}
                                    className="mui-shadow"
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y - 35}
                                    fontSize={14}
                                    textAnchor="middle"
                                    fill="#333"
                                    fontWeight="bold"
                                >
                                    {id}
                                </text>
                                {sampleFlowData[id] && (
                                    <text
                                        x={pos.x}
                                        y={pos.y + 40}
                                        fontSize={12}
                                        fill="#444"
                                        textAnchor="middle"
                                    >
                                        {sampleFlowData[id]} kWh
                                    </text>
                                )}
                            </g>
                        ))}
                    </>
                )}
            </svg>
        </div>
    );
};

export default EnergyFlowGraph;
