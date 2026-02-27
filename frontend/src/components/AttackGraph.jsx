import { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const SEV_COLOR = { high: '#ff4757', medium: '#ffa502', low: '#2ed573' };

export default function AttackGraph({ domain, assets }) {
    const fgRef = useRef();

    const { nodes, links } = useMemo(() => {
        const nodes = [
            {
                id: domain,
                label: domain,
                type: 'root',
                color: '#00d4ff',
                size: 10,
            },
            ...assets.map((a) => ({
                id: a.subdomain,
                label: a.subdomain,
                type: 'asset',
                severity: a.severity,
                color: SEV_COLOR[a.severity] || '#7fa8d0',
                size: a.severity === 'high' ? 7 : a.severity === 'medium' ? 5 : 3,
                ports: (a.open_ports || []).join(', '),
                score: a.risk_score,
            })),
        ];

        const links = assets.map((a) => ({
            source: domain,
            target: a.subdomain,
            color:
                a.severity === 'high'
                    ? 'rgba(255,71,87,0.4)'
                    : a.severity === 'medium'
                        ? 'rgba(255,165,2,0.35)'
                        : 'rgba(46,213,115,0.3)',
        }));

        return { nodes, links };
    }, [domain, assets]);

    useEffect(() => {
        if (fgRef.current) {
            setTimeout(() => {
                fgRef.current.zoomToFit(400, 30);
            }, 600);
        }
    }, [nodes]);

    return (
        <div className="attack-graph-wrap">
            <div className="graph-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: '#00d4ff' }} />Root Domain</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#ff4757' }} />High</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#ffa502' }} />Medium</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#2ed573' }} />Low</span>
            </div>
            <div className="graph-container">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={{ nodes, links }}
                    backgroundColor="transparent"
                    nodeLabel={(n) =>
                        n.type === 'root'
                            ? `Root: ${n.label}`
                            : `${n.label}\nRisk: ${n.score} | Ports: ${n.ports || 'none'}`
                    }
                    nodeColor={(n) => n.color}
                    nodeVal={(n) => n.size}
                    linkColor={(l) => l.color}
                    linkWidth={1.5}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.label;
                        const fontSize = node.type === 'root' ? 13 / globalScale : 10 / globalScale;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color;
                        ctx.fill();
                        // glow
                        ctx.shadowColor = node.color;
                        ctx.shadowBlur = node.type === 'root' ? 18 : 8;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                        // label
                        if (globalScale > 0.5) {
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            ctx.fillStyle = '#c8d8e8';
                            ctx.textAlign = 'center';
                            ctx.fillText(
                                label.length > 22 ? label.slice(0, 20) + '…' : label,
                                node.x,
                                node.y + node.size + fontSize + 2,
                            );
                        }
                    }}
                    cooldownTicks={80}
                    width={900}
                    height={420}
                />
            </div>
        </div>
    );
}
