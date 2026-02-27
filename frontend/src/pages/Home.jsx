import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startScan } from '../services/api';
import DomainInput from '../components/DomainInput';
import sentinelLogo from '../assets/sentinel-logo.png';
import { Search, Zap, Bot, Skull } from 'lucide-react';

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
            {/* Rotating Earth Background */}
            <div className="earth-bg">
                <img
                    src="https://images.unsplash.com/photo-1676944229887-b2def0f94185?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXJ0aCUyMHBsYW5ldCUyMHNwYWNlJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzcyMTkzMDE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Rotating Earth"
                />
                <div className="earth-overlay-v" />
                <div className="earth-overlay-h" />
            </div>

            <div className="home-content">
                {/* Logo */}
                <div className="logo-area">
                    <img src={sentinelLogo} alt="Sentinel" className="logo-icon-img" />
                    <h1 className="logo-title">
                        SENTINEL<span className="accent">AI</span>
                    </h1>
                    <p className="logo-subtitle">Attack Surface Intelligence Platform</p>
                </div>

                {/* Scan card */}
                <div className="scan-card">
                    <h2>
                        <span className="card-icon"><Zap size={16} /></span>
                        Analyze Your Attack Surface
                    </h2>
                    <p className="scan-desc">
                        Enter a target domain to begin surface mapping. Discover subdomains,
                        assess risk exposure, and receive AI-powered security intelligence.
                    </p>
                    <DomainInput onScan={handleScan} loading={loading} />
                    {error && <div className="error-msg">{error}</div>}
                </div>

                {/* Feature highlights */}
                <div className="features-grid">
                    {[
                        { Icon: Search, title: 'Subdomain Discovery', desc: 'CT logs & OSINT recon' },
                        { Icon: Zap, title: 'Risk Scoring', desc: 'Deterministic exposure scoring' },
                        { Icon: Bot, title: 'AI Analysis', desc: 'Gemini-powered summaries' },
                        { Icon: Skull, title: 'Attack Simulation', desc: 'Red-team narrative generation' },
                    ].map(({ Icon, title, desc }) => (
                        <div className="feature-card" key={title}>
                            <span className="feature-icon"><Icon size={28} /></span>
                            <h3>{title}</h3>
                            <p>{desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
