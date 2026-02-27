import { Bot } from 'lucide-react';

/**
 * Parses a line of AI-generated text and returns a styled React element.
 * Handles: **bold headings**, bullet points (- or •), numbered lists, inline **bold**.
 */
function parseLine(line, i) {
    // Heading: starts and ends with **
    if (/^\*\*(.+)\*\*$/.test(line)) {
        const text = line.replace(/\*\*/g, '');
        return <h4 key={i} className="ai-heading">{text}</h4>;
    }

    // Heading: starts with ### or ##
    if (/^#{2,3}\s+(.+)/.test(line)) {
        const text = line.replace(/^#{2,3}\s+/, '');
        return <h4 key={i} className="ai-heading">{text}</h4>;
    }

    // Bullet point: starts with - or •  or *
    if (/^\s*[-•*]\s+/.test(line)) {
        const text = line.replace(/^\s*[-•*]\s+/, '');
        return (
            <li key={i} className="ai-bullet">
                {renderInlineBold(text)}
            </li>
        );
    }

    // Numbered list: starts with 1. 2. etc.
    if (/^\s*\d+[.)]\s+/.test(line)) {
        const text = line.replace(/^\s*\d+[.)]\s+/, '');
        const num = line.match(/^\s*(\d+)/)[1];
        return (
            <div key={i} className="ai-numbered-item">
                <span className="ai-num">{num}.</span>
                <span>{renderInlineBold(text)}</span>
            </div>
        );
    }

    // Regular paragraph with potential inline bold
    return <p key={i} className="ai-para">{renderInlineBold(line)}</p>;
}

/**
 * Renders inline **bold** markdown within a string.
 */
function renderInlineBold(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="ai-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

export default function AISummary({ summary }) {
    if (!summary) {
        return (
            <div className="ai-summary-empty">
                <Bot size={32} className="ai-empty-icon" />
                <p>No AI summary available for this scan.</p>
            </div>
        );
    }

    const lines = summary
        .split(/\n/)
        .map((p) => p.trim())
        .filter(Boolean);

    // Group consecutive bullet points into <ul> blocks
    const elements = [];
    let bulletBuffer = [];

    const flushBullets = () => {
        if (bulletBuffer.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="ai-bullet-list">
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

    return (
        <div className="ai-summary">
            <div className="ai-summary-header">
                <span className="ai-pulse" aria-hidden="true" />
                <span className="ai-badge">AI-Powered · Gemini</span>
            </div>
            <div className="ai-summary-body">
                {elements}
            </div>
        </div>
    );
}
