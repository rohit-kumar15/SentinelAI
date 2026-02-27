import { useState } from 'react';

export default function DomainInput({ onScan, loading }) {
    const [domain, setDomain] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const d = domain.trim();
        if (d) onScan(d);
    };

    return (
        <form className="domain-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
                <span className="input-icon">🔍</span>
                <input
                    id="domain-input"
                    type="text"
                    className="domain-input"
                    placeholder="Enter domain (e.g. example.com)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>
            <button
                id="scan-submit-btn"
                type="submit"
                className="scan-btn"
                disabled={loading || !domain.trim()}
            >
                {loading ? (
                    <span className="btn-loading">
                        <span className="spinner-small" />
                        Scanning…
                    </span>
                ) : '⚡ Analyze'}
            </button>
        </form>
    );
}
