import { useState } from 'react';
import { simulateAttack } from '../services/api';
import { Skull, Zap, RefreshCw } from 'lucide-react';

/**
 * Parses a line of AI-generated attack narrative and returns a styled React element.
 */
function parseLine(line, i) {
    // Heading: starts and ends with **
    if (/^\*\*(.+)\*\*$/.test(line)) {
        const text = line.replace(/\*\*/g, '');
        return <h4 key={i} className="sim-section-title">{text}</h4>;
    }

    // Heading: starts with ### or ##
    if (/^#{2,3}\s+(.+)/.test(line)) {
        const text = line.replace(/^#{2,3}\s+/, '');
        return <h4 key={i} className="sim-section-title">{text}</h4>;
    }

    // Phase/step marker: "Phase 1:", "Step 1:", numbered with colon
    if (/^(Phase|Step|Stage)\s+\d+/i.test(line)) {
        return <h4 key={i} className="sim-phase-title">{renderInlineBold(line)}</h4>;
    }

    // Bullet point
    if (/^\s*[-•*]\s+/.test(line)) {
        const text = line.replace(/^\s*[-•*]\s+/, '');
        return (
            <li key={i} className="sim-bullet">
                {renderInlineBold(text)}
            </li>
        );
    }

    // Numbered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
        const text = line.replace(/^\s*\d+[.)]\s+/, '');
        const num = line.match(/^\s*(\d+)/)[1];
        return (
            <div key={i} className="sim-numbered-item">
                <span className="sim-num">{num}.</span>
                <span>{renderInlineBold(text)}</span>
            </div>
        );
    }

    // Regular line with inline bold
    return <p key={i} className="sim-line">{renderInlineBold(line)}</p>;
}

function renderInlineBold(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="sim-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

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

    // Parse narrative into structured elements, grouping bullets into <ul>
    const buildElements = (text) => {
        const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
        const elements = [];
        let bulletBuffer = [];

        const flushBullets = () => {
            if (bulletBuffer.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="sim-bullet-list">
                        {bulletBuffer}
                    </ul>
                );
                bulletBuffer = [];
            }
        };

        lines.forEach((line, i) => {
            const isBullet = /^\s*[-•*]\s+/.test(line);
            if (isBullet) {
                bulletBuffer.push(parseLine(line, i));
            } else {
                flushBullets();
                elements.push(parseLine(line, i));
            }
        });
        flushBullets();
        return elements;
    };

    return (
        <div className="attack-sim">
            {!revealed && !loading && (
                <div className="sim-cta">
                    <div className="sim-cta-icon"><Skull size={48} /></div>
                    <p className="sim-cta-desc">
                        Generate a red-team attacker narrative using AI. See your network through the eyes of an adversary.
                    </p>
                    <button
                        id="simulate-attack-btn"
                        className="sim-btn"
                        onClick={handleSimulate}
                    >
                        <Zap size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        Run Attack Simulation
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
                    <p>{error}</p>
                    <button className="sim-retry" onClick={handleSimulate}>Retry</button>
                </div>
            )}

            {revealed && narrative && (
                <div className="sim-result">
                    <div className="sim-result-header">
                        <Skull size={20} className="sim-skull-icon" />
                        <span className="sim-title">Adversary Simulation Report</span>
                        <span className="sim-chip">AI GENERATED</span>
                    </div>
                    <div className="sim-narrative">
                        {buildElements(narrative)}
                    </div>
                    <button
                        className="sim-re-run"
                        onClick={handleSimulate}
                        disabled={loading}
                    >
                        <RefreshCw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Re-run Simulation
                    </button>
                </div>
            )}
        </div>
    );
}
