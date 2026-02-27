import { useState } from 'react';
import { simulateAttack } from '../services/api';

export default function AttackSimulation({ scanId }) {
    const [narrative, setNarrative] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [revealed, setRevealed] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        setError('');
        setRevealed(false);
        try {
            const res = await simulateAttack(scanId);
            setNarrative(res.data.attack_narrative);
            setRevealed(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Attack simulation failed.');
        } finally {
            setLoading(false);
        }
    };

    const lines = narrative
        ? narrative.split(/\n+/).map((l) => l.trim()).filter(Boolean)
        : [];

    return (
        <div className="attack-sim">
            {!revealed && !loading && (
                <div className="sim-cta">
                    <div className="sim-cta-icon">💀</div>
                    <p className="sim-cta-desc">
                        Generate a red-team attacker narrative using AI. See your network through the eyes of an adversary.
                    </p>
                    <button
                        id="simulate-attack-btn"
                        className="sim-btn"
                        onClick={handleSimulate}
                    >
                        ⚡ Run Attack Simulation
                    </button>
                </div>
            )}

            {loading && (
                <div className="sim-loading">
                    <div className="sim-spinner" />
                    <p className="sim-loading-text">Generating adversary narrative…</p>
                    <p className="sim-loading-sub">AI is simulating an attacker's perspective.</p>
                </div>
            )}

            {error && (
                <div className="sim-error">
                    <p>⚠️ {error}</p>
                    <button className="sim-retry" onClick={handleSimulate}>Retry</button>
                </div>
            )}

            {revealed && narrative && (
                <div className="sim-result">
                    <div className="sim-result-header">
                        <span className="sim-skull">💀</span>
                        <span className="sim-title">Adversary Simulation Report</span>
                        <span className="sim-chip">AI GENERATED</span>
                    </div>
                    <div className="sim-narrative">
                        {lines.map((line, i) => {
                            // Detect heading-like lines (start with ** or are all caps short)
                            const isHeading = line.startsWith('**') && line.endsWith('**');
                            const cleanLine = isHeading ? line.replace(/\*\*/g, '') : line;
                            return isHeading ? (
                                <h4 key={i} className="sim-section-title">{cleanLine}</h4>
                            ) : (
                                <p key={i} className="sim-line">{line}</p>
                            );
                        })}
                    </div>
                    <button
                        className="sim-re-run"
                        onClick={handleSimulate}
                        disabled={loading}
                    >
                        🔄 Re-run Simulation
                    </button>
                </div>
            )}
        </div>
    );
}
