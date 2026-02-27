import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResult } from '../services/api';
import RiskHeatmap from '../components/RiskHeatmap';
import AssetTable from '../components/AssetTable';
import AttackGraph from '../components/AttackGraph';
import AISummary from '../components/AISummary';
import AttackSimulation from '../components/AttackSimulation';
import { Shield, Bot, Satellite, Network, Skull, Settings, X } from 'lucide-react';

const CARDS = [
    { key: 'risk', label: 'Overall Risk' },
    { key: 'severity', label: 'Severity Distribution' },
    { key: 'ai', label: 'AI Summary' },
    { key: 'assets', label: 'Discovered Assets' },
    { key: 'graph', label: 'Attack Graph' },
    { key: 'sim', label: 'Attack Simulation' },
];

const SPAN_OPTIONS = [
    { value: '', label: '1' },
    { value: 'span-2', label: '2' },
    { value: 'span-3', label: '3' },
    { value: 'span-full', label: '4' },
];

const DEFAULT_SPANS = {
    risk: '',
    severity: 'span-3',
    ai: 'span-2',
    assets: 'span-2',
    graph: 'span-2',
    sim: 'span-full',
};

export default function Dashboard() {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showResize, setShowResize] = useState(false);

    // Load saved layout or use defaults
    const [spans, setSpans] = useState(() => {
        try {
            const saved = localStorage.getItem('dash-layout');
            return saved ? JSON.parse(saved) : { ...DEFAULT_SPANS };
        } catch {
            return { ...DEFAULT_SPANS };
        }
    });

    // Save layout on change
    useEffect(() => {
        localStorage.setItem('dash-layout', JSON.stringify(spans));
    }, [spans]);

    useEffect(() => {
        (async () => {
            try {
                const res = await getResult(scanId);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load results.');
            } finally {
                setLoading(false);
            }
        })();
    }, [scanId]);

    const updateSpan = (key, value) => {
        setSpans((prev) => ({ ...prev, [key]: value }));
    };

    const resetLayout = () => setSpans({ ...DEFAULT_SPANS });

    if (loading) return (
        <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Analysing attack surface…</p>
        </div>
    );

    if (error) return (
        <div className="error-screen">
            <p>{error}</p>
            <button onClick={() => navigate('/')}>← Back to Home</button>
        </div>
    );

    const riskColor =
        data.risk_score >= 70 ? '#ff4757' :
            data.risk_score >= 40 ? '#ffa502' : '#2ed573';

    const cn = (key) => `card ${spans[key] || ''}`.trim();

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dash-header">
                <button className="back-btn" onClick={() => navigate('/')}>← New Scan</button>
                <div className="dash-title">
                    <Shield size={22} className="dash-icon-svg" />
                    <h1>SENTINEL<span className="title-accent">AI</span> Dashboard</h1>
                </div>
                <div className="dash-header-right">
                    <button
                        className={`resize-toggle ${showResize ? 'active' : ''}`}
                        onClick={() => setShowResize(!showResize)}
                        title="Customize layout"
                    >
                        {showResize ? <X size={16} /> : <Settings size={16} />}
                    </button>
                    <span className="domain-badge">{data.domain}</span>
                </div>
            </header>

            {/* Resize Panel */}
            {showResize && (
                <div className="resize-panel">
                    <div className="resize-panel-header">
                        <span className="resize-panel-title">Card Layout (columns)</span>
                        <button className="resize-reset" onClick={resetLayout}>Reset</button>
                    </div>
                    <div className="resize-grid">
                        {CARDS.map((card) => (
                            <div key={card.key} className="resize-item">
                                <span className="resize-label">{card.label}</span>
                                <div className="resize-btns">
                                    {SPAN_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`resize-btn ${spans[card.key] === opt.value ? 'active' : ''}`}
                                            onClick={() => updateSpan(card.key, opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dash-grid">
                {/* ── Risk Score ── */}
                <div className={cn('risk') + ' risk-card'}>
                    <h2>Overall Risk</h2>
                    <div className="risk-score-display" style={{ color: riskColor }}>
                        {data.risk_score}<span className="risk-max">/100</span>
                    </div>
                    <div className="risk-label" style={{ color: riskColor }}>
                        {data.risk_score >= 70 ? 'HIGH RISK' :
                            data.risk_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'}
                    </div>
                    <div className="severity-pills">
                        <span className="pill high">High: {data.severity_distribution.high}</span>
                        <span className="pill medium">Med: {data.severity_distribution.medium}</span>
                        <span className="pill low">Low: {data.severity_distribution.low}</span>
                    </div>
                </div>

                {/* ── Heatmap ── */}
                <div className={cn('severity')}>
                    <h2>Severity Distribution</h2>
                    <RiskHeatmap distribution={data.severity_distribution} assets={data.assets} />
                </div>

                {/* ── AI Summary ── */}
                <div className={cn('ai')}>
                    <h2><Bot size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />AI Security Summary</h2>
                    <AISummary summary={data.ai_summary} />
                </div>

                {/* ── Asset Table ── */}
                <div className={cn('assets')}>
                    <h2><Satellite size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Discovered Assets ({data.assets.length})</h2>
                    <AssetTable assets={data.assets} />
                </div>

                {/* ── Attack Graph ── */}
                <div className={cn('graph')}>
                    <h2><Network size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Attack Surface Graph</h2>
                    <AttackGraph domain={data.domain} assets={data.assets} />
                </div>

                {/* ── Attack Simulation ── */}
                <div className={cn('sim')}>
                    <h2><Skull size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Attack Simulation</h2>
                    <AttackSimulation scanId={scanId} />
                </div>
            </div>
        </div>
    );
}
