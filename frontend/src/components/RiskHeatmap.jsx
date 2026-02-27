import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const SEV_COLORS = { high: '#ff4757', medium: '#ffa502', low: '#2ed573' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-tooltip">
        <p className="rt-label">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.fill || p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RiskHeatmap({ distribution, assets }) {
  // Bar chart: top 10 assets by risk score
  const barData = [...assets]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10)
    .map((a) => ({
      name: a.subdomain.length > 20 ? a.subdomain.slice(0, 18) + '…' : a.subdomain,
      score: a.risk_score,
      severity: a.severity,
    }));

  // Radar chart: severity breakdown
  const radarData = [
    { subject: 'High Risk', value: distribution.high, fullMark: assets.length || 1 },
    { subject: 'Medium Risk', value: distribution.medium, fullMark: assets.length || 1 },
    { subject: 'Low Risk', value: distribution.low, fullMark: assets.length || 1 },
    { subject: 'Total', value: assets.length, fullMark: assets.length || 1 },
  ];

  return (
    <div className="heatmap-grid">
      {/* ── Severity Radar ── */}
      <div className="heatmap-section">
        <p className="chart-label">Severity Radar</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e3a5f" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#7fa8d0', fontSize: 11 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar
              name="Count"
              dataKey="value"
              stroke="#00d4ff"
              fill="#00d4ff"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Risk Score Bars ── */}
      {barData.length > 0 && (
        <div className="heatmap-section">
          <p className="chart-label">Top Assets by Risk</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7fa8d0', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: '#7fa8d0', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Risk Score" radius={[0, 4, 4, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={SEV_COLORS[entry.severity] || '#00d4ff'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
