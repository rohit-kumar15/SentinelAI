import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startScan } from '../services/api';
import DomainInput from '../components/DomainInput';

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleScan = async (domain) => {
        setLoading(true);
        setError('');
        try {
            const res = await startScan(domain);
            navigate(`/dashboard/${res.data.scan_id}`);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.message ||
                'Scan failed. Make sure the backend is running on port 8000.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            <div className="home-content">

                {/* Logo */}
                <div className="logo-area">
                    <div className="logo-icon">🛡️</div>
                    <h1 className="logo-title">SentenalAI</h1>
                    <p className="logo-subtitle">Attack Surface Intelligence Platform</p>
                </div>

                {/* Scan card */}
                <div className="scan-card">
                    <h2>Analyze Your Attack Surface</h2>
                    <p className="scan-desc">
                        Enter a domain to discover subdomains, assess risk exposure, and receive
                        AI-powered security intelligence.
                    </p>
                    <DomainInput onScan={handleScan} loading={loading} />
                    {error && <div className="error-msg">⚠️ {error}</div>}
                </div>

                {/* Feature highlights */}
                <div className="features-grid">
                    {[
                        { icon: '🔍', title: 'Subdomain Discovery', desc: 'CT logs & OSINT recon' },
                        { icon: '⚡', title: 'Risk Scoring', desc: 'Deterministic exposure scoring' },
                        { icon: '🤖', title: 'AI Analysis', desc: 'Gemini-powered summaries' },
                        { icon: '💀', title: 'Attack Simulation', desc: 'Red-team narrative generation' },
                    ].map(({ icon, title, desc }) => (
                        <div className="feature-card" key={title}>
                            <span className="feature-icon">{icon}</span>
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
