export default function AISummary({ summary }) {
    if (!summary) {
        return (
            <div className="ai-summary-empty">
                <span className="ai-icon">🤖</span>
                <p>No AI summary available for this scan.</p>
            </div>
        );
    }

    // Split into paragraphs for better readability
    const paragraphs = summary
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

    return (
        <div className="ai-summary">
            <div className="ai-summary-header">
                <span className="ai-pulse" aria-hidden="true" />
                <span className="ai-badge">AI-Powered · Gemini</span>
            </div>
            <div className="ai-summary-body">
                {paragraphs.map((para, i) => (
                    <p key={i} className="ai-para">{para}</p>
                ))}
            </div>
        </div>
    );
}
