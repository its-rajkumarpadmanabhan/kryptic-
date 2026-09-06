import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { X, Layers, Search, Hash } from 'lucide-react';

export default function LinesModal({ doc, onClose }) {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    if (doc) {
      api.getDocumentLines(doc.id)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [doc]);

  if (!doc) return null;

  const filteredLines = data?.lines.filter((l) =>
    l.text.toLowerCase().includes(filterText.toLowerCase())
  ) || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 540,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: theme.badgeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={18} color={theme.accent} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>
                Line-by-Line Scanned Data
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: theme.subtext, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 300 }}>
                {doc.filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.subtext,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Input */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.cardBorder}` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            <Search size={16} color={theme.subtext} />
            <input
              type="text"
              placeholder="Filter scanned lines..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text,
                outline: 'none',
                width: '100%',
                fontSize: 13,
              }}
            />
            {data && (
              <span style={{ fontSize: 11, color: theme.subtext, whiteSpace: 'nowrap' }}>
                {filteredLines.length} / {data.total_lines} lines
              </span>
            )}
          </div>
        </div>

        {/* Line Content List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.subtext }}>
              Loading scanned lines...
            </div>
          ) : filteredLines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.subtext }}>
              No matching lines found.
            </div>
          ) : (
            filteredLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderLeft: `2px solid ${theme.cardBorder}`,
                  marginBottom: 4,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                <div style={{
                  color: theme.accent,
                  minWidth: 40,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  opacity: 0.8,
                  userSelect: 'none',
                }}>
                  <Hash size={10} />
                  {line.line_no}
                </div>
                <div style={{ color: theme.text, flex: 1 }}>
                  {line.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${theme.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.bg,
        }}>
          <span style={{ fontSize: 12, color: theme.subtext }}>
            Extracted & Indexed by Kryptic OCR Engine
          </span>
          <button
            onClick={onClose}
            style={{
              background: theme.card,
              border: `1px solid ${theme.cardBorder}`,
              color: theme.text,
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
