import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Search, Hash, FileText, Car, AlertCircle, ArrowRight } from 'lucide-react';

export default function SearchScreen({ onSelectDoc }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchLines(query);
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span
          key={i}
          style={{
            backgroundColor: 'rgba(255, 230, 0, 0.3)',
            color: theme.id === 'light' ? '#b45309' : '#fef08a',
            fontWeight: 700,
            padding: '1px 4px',
            borderRadius: 3,
            borderBottom: `2px solid ${theme.accent}`,
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      {/* Search Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: theme.text }}>
          Deep Line-by-Line Search
        </h2>
        <p style={{ fontSize: 12, color: theme.subtext, margin: 0 }}>
          Searches through every scanned line across all PDF, DOCX, and text files.
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: '6px 14px',
          boxShadow: `0 4px 16px ${theme.glow}`,
        }}>
          <Search size={20} color={theme.accent} />
          <input
            id="line-search-input"
            type="text"
            placeholder="Type vehicle number, keyword, policy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.text,
              fontSize: 14,
              padding: '8px 0',
            }}
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            style={{
              backgroundColor: theme.accent,
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
              opacity: searching || !query.trim() ? 0.6 : 1,
            }}
          >
            {searching ? 'Scanning...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Quick Search Suggestions */}
      {!results && (
        <div style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: theme.subtext, fontWeight: 700 }}>
            Try Quick Searches:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['DL 01 AB', 'MH 12 DE', 'Pollution', 'Insurance', 'Valid Upto', 'HDFC'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  api.searchLines(tag).then((res) => setResults(res));
                }}
                style={{
                  backgroundColor: theme.badgeBg,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.accent,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                "{tag}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      {results && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
            Found {results.total_matches} matching line(s) for "{results.query}"
          </span>
          <button
            onClick={() => { setResults(null); setQuery(''); }}
            style={{ background: 'transparent', border: 'none', color: theme.secondary, fontSize: 12, cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Results List */}
      {results && results.matches.length === 0 ? (
        <div style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: 36,
          textAlign: 'center',
          color: theme.subtext,
        }}>
          <AlertCircle size={32} color={theme.subtext} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No lines matched your search query.</p>
        </div>
      ) : results ? (
        results.matches.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: theme.card,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {/* Document and vehicle header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} color={theme.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>
                  {item.filename}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.vehicle_number && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}>
                    🚗 {item.vehicle_number}
                  </span>
                )}
                <span style={{
                  fontSize: 10,
                  backgroundColor: theme.badgeBg,
                  color: theme.accent,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}>
                  {item.category}
                </span>
              </div>
            </div>

            {/* Matched Line Text */}
            <div style={{
              backgroundColor: theme.bg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              lineHeight: 1.4,
              display: 'flex',
              gap: 10,
            }}>
              <span style={{ color: theme.accent, opacity: 0.8, fontSize: 11, userSelect: 'none' }}>
                L{item.line_number}:
              </span>
              <div style={{ color: theme.text, flex: 1, wordBreak: 'break-word' }}>
                {highlightMatch(item.matched_text, results.query)}
              </div>
            </div>
          </div>
        ))
      ) : null}
    </div>
  );
}
