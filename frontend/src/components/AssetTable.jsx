import { useState, useMemo } from 'react';

const SEV_CLASS = { high: 'badge-high', medium: 'badge-med', low: 'badge-low' };
const SEV_ICON = { high: '🔴', medium: '🟠', low: '🟢' };

export default function AssetTable({ assets }) {
    const [filter, setFilter] = useState('all');
    const [sortKey, setSortKey] = useState('risk_score');
    const [asc, setAsc] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        let list = [...assets];
        if (filter !== 'all') list = list.filter((a) => a.severity === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((a) => a.subdomain.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            if (typeof av === 'number') return asc ? av - bv : bv - av;
            return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
        return list;
    }, [assets, filter, sortKey, asc, search]);

    const toggleSort = (key) => {
        if (sortKey === key) setAsc((p) => !p);
        else { setSortKey(key); setAsc(false); }
    };

    const Th = ({ col, label }) => (
        <th
            className={`th-sortable ${sortKey === col ? 'th-active' : ''}`}
            onClick={() => toggleSort(col)}
        >
            {label} {sortKey === col ? (asc ? '↑' : '↓') : ''}
        </th>
    );

    return (
        <div className="asset-table-wrap">
            {/* Controls */}
            <div className="table-controls">
                <input
                    className="table-search"
                    type="text"
                    placeholder="Search subdomain…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="sev-filters">
                    {['all', 'high', 'medium', 'low'].map((s) => (
                        <button
                            key={s}
                            className={`sev-btn ${filter === s ? 'active' : ''} ${s !== 'all' ? `sev-${s}` : ''}`}
                            onClick={() => setFilter(s)}
                        >
                            {s === 'all' ? 'All' : `${SEV_ICON[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="table-scroll">
                <table className="asset-table">
                    <thead>
                        <tr>
                            <Th col="subdomain" label="Subdomain" />
                            <Th col="ip" label="IP Address" />
                            <Th col="open_ports" label="Open Ports" />
                            <Th col="risk_score" label="Risk Score" />
                            <Th col="severity" label="Severity" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="table-empty">No assets match this filter.</td>
                            </tr>
                        ) : (
                            filtered.map((a, i) => (
                                <tr key={i} className={`asset-row row-${a.severity}`}>
                                    <td className="td-mono">{a.subdomain}</td>
                                    <td className="td-mono td-dim">{a.ip || '—'}</td>
                                    <td>
                                        {(a.open_ports || []).length > 0 ? (
                                            <span className="port-list">
                                                {a.open_ports.map((p) => (
                                                    <span key={p} className="port-badge">{p}</span>
                                                ))}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <div className="score-bar-wrap">
                                            <div
                                                className="score-bar-fill"
                                                style={{
                                                    width: `${a.risk_score}%`,
                                                    background: a.severity === 'high' ? '#ff4757' :
                                                        a.severity === 'medium' ? '#ffa502' : '#2ed573',
                                                }}
                                            />
                                            <span className="score-label">{a.risk_score}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`severity-badge ${SEV_CLASS[a.severity]}`}>
                                            {SEV_ICON[a.severity]} {a.severity.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="table-count">{filtered.length} of {assets.length} assets</p>
        </div>
    );
}
