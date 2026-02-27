import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResult } from '../services/api';
import RiskHeatmap from '../components/RiskHeatmap';
import AssetTable from '../components/AssetTable';
import AttackGraph from '../components/AttackGraph';
import AISummary from '../components/AISummary';
import AttackSimulation from '../components/AttackSimulation';

export default function Dashboard() {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return (
        <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Analysing attack surface…</p>
        </div>
    );

    if (error) return (
        <div className="error-screen">
            <p>❌ {error}</p>
            <button onClick={() => navigate('/')}>← Back to Home</button>
        </div>
    );

    const riskColor =
        data.risk_score >= 70 ? '#ff4757' :
            data.risk_score >= 40 ? '#ffa502' : '#2ed573';

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dash-header">
                <button className="back-btn" onClick={() => navigate('/')}>← New Scan</button>
                <div className="dash-title">
                    <span className="dash-icon">🛡️</span>
                    <h1>SentenalAI Dashboard</h1>
                </div>
                <span className="domain-badge">{data.domain}</span>
            </header>

            <div className="dash-grid">
                {/* ── Risk Score ── */}
                <div className="card risk-card">
                    <h2>Overall Risk</h2>
                    <div className="risk-score-display" style={{ color: riskColor }}>
                        {data.risk_score}<span className="risk-max">/100</span>
                    </div>
                    <div className="risk-label" style={{ color: riskColor }}>
                        {data.risk_score >= 70 ? '🔴 HIGH RISK' :
                            data.risk_score >= 40 ? '🟠 MEDIUM RISK' : '🟢 LOW RISK'}
                    </div>
                    <div className="severity-pills">
                        <span className="pill high">High: {data.severity_distribution.high}</span>
                        <span className="pill medium">Med: {data.severity_distribution.medium}</span>
                        <span className="pill low">Low: {data.severity_distribution.low}</span>
                    </div>
                </div>

                {/* ── Heatmap ── */}
                <div className="card">
                    <h2>Severity Distribution</h2>
                    <RiskHeatmap distribution={data.severity_distribution} assets={data.assets} />
                </div>

                {/* ── AI Summary ── */}
                <div className="card span-2">
                    <h2>🤖 AI Security Summary</h2>
                    <AISummary summary={data.ai_summary} />
                </div>

                {/* ── Asset Table ── */}
                <div className="card span-2">
                    <h2>📡 Discovered Assets ({data.assets.length})</h2>
                    <AssetTable assets={data.assets} />
                </div>

                {/* ── Attack Graph ── */}
                <div className="card span-2">
                    <h2>🕸️ Attack Surface Graph</h2>
                    <AttackGraph domain={data.domain} assets={data.assets} />
                </div>

                {/* ── Attack Simulation ── */}
                <div className="card span-full">
                    <h2>💀 Attack Simulation</h2>
                    <AttackSimulation scanId={scanId} />
                </div>
            </div>
        </div>
    );
}
