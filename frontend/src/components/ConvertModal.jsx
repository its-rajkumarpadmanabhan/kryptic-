import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { X, FileCode, FileText, Download, CheckCircle, Loader2 } from 'lucide-react';

export default function ConvertModal({ doc, onClose }) {
  const { theme } = useTheme();
  const [targetFormat, setTargetFormat] = useState('docx');
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!doc) return null;

  const handleConvert = async () => {
    setConverting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.convertDocument(doc.id, targetFormat);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

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
        maxWidth: 440,
        boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
        overflow: 'hidden',
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
            Convert Document Format
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.subtext, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: theme.subtext, marginBottom: 16 }}>
          Source: <strong style={{ color: theme.text }}>{doc.filename}</strong> ({doc.file_type.toUpperCase()})
        </p>

        {/* Target Format Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => { setTargetFormat('docx'); setResult(null); }}
            style={{
              padding: 14,
              borderRadius: 12,
              border: `2px solid ${targetFormat === 'docx' ? theme.accent : theme.cardBorder}`,
              background: targetFormat === 'docx' ? theme.badgeBg : theme.bg,
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <FileText size={26} color={targetFormat === 'docx' ? theme.accent : theme.subtext} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Microsoft Word</span>
            <span style={{ fontSize: 11, color: theme.subtext }}>.DOCX document</span>
          </button>

          <button
            onClick={() => { setTargetFormat('html'); setResult(null); }}
            style={{
              padding: 14,
              borderRadius: 12,
              border: `2px solid ${targetFormat === 'html' ? theme.accent : theme.cardBorder}`,
              background: targetFormat === 'html' ? theme.badgeBg : theme.bg,
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <FileCode size={26} color={targetFormat === 'html' ? theme.accent : theme.subtext} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Web Page</span>
            <span style={{ fontSize: 11, color: theme.subtext }}>.HTML file</span>
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {result ? (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <CheckCircle size={32} color="#10b981" style={{ marginBottom: 8 }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: 15, color: '#10b981', fontWeight: 700 }}>
              Conversion Complete!
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: 12, color: theme.text }}>
              {result.converted_filename}
            </p>
            <a
              href={result.download_url}
              download={result.converted_filename}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#10b981',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Download size={16} /> Download {targetFormat.toUpperCase()}
            </a>
          </div>
        ) : (
          <button
            onClick={handleConvert}
            disabled={converting}
            style={{
              width: '100%',
              backgroundColor: theme.accent,
              color: '#ffffff',
              border: 'none',
              padding: '12px 0',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: converting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 4px 16px ${theme.glow}`,
              opacity: converting ? 0.7 : 1,
            }}
          >
            {converting ? (
              <>
                <Loader2 size={18} className="spin" />
                Converting document...
              </>
            ) : (
              `Convert to ${targetFormat.toUpperCase()}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
