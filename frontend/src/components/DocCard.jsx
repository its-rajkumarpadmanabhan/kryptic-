import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, 
  Share2, 
  RefreshCw, 
  Trash2, 
  Layers, 
  ArrowRightLeft, 
  Calendar, 
  AlertTriangle, 
  Car, 
  Download,
  Clock
} from 'lucide-react';

export default function DocCard({ doc, onViewLines, onConvert, onReupload, onDelete }) {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const handleShare = async () => {
    const shareData = {
      title: `Kryptic Document: ${doc.filename}`,
      text: `Document: ${doc.filename} (${doc.category})`,
      url: window.location.origin + doc.download_url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') alert(`Share error: ${err.message}`);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard for sharing!');
    }
  };

  const handleReuploadChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onReupload(doc.id, file);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{
      backgroundColor: theme.card,
      border: `1px solid ${doc.is_expiring_soon ? '#ef4444' : theme.cardBorder}`,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      boxShadow: doc.is_expiring_soon 
        ? '0 4px 20px rgba(239, 68, 68, 0.25)' 
        : '0 2px 10px rgba(0,0,0,0.2)',
      position: 'relative',
      transition: 'all 0.2s ease',
    }}>
      {/* Top row: Icon, Title & Expiry Alert Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: theme.badgeBg,
            border: `1px solid ${theme.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileText size={20} color={theme.accent} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: theme.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {doc.filename}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: theme.bg,
                color: theme.secondary,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${theme.cardBorder}`,
              }}>
                {doc.file_type}
              </span>
              <span style={{ fontSize: 11, color: theme.subtext }}>
                {formatSize(doc.file_size)}
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Expiry Badge */}
        {doc.expiry_date && (
          <div style={{
            backgroundColor: doc.days_remaining <= 0 
              ? 'rgba(239, 68, 68, 0.2)' 
              : doc.days_remaining <= 7 
              ? 'rgba(245, 158, 11, 0.2)' 
              : theme.badgeBg,
            border: `1px solid ${doc.days_remaining <= 0 ? '#ef4444' : doc.days_remaining <= 7 ? '#f59e0b' : theme.accent}`,
            color: doc.days_remaining <= 0 ? '#ef4444' : doc.days_remaining <= 7 ? '#f59e0b' : theme.text,
            padding: '4px 8px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}>
            {doc.days_remaining <= 7 && <AlertTriangle size={12} />}
            {doc.days_remaining <= 0 ? 'EXPIRED' : `${doc.days_remaining}d left`}
          </div>
        )}
      </div>

      {/* Metadata Badges: Category & Vehicle Registration */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span style={{
          backgroundColor: theme.badgeBg,
          color: theme.accent,
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 6,
        }}>
          {doc.category}
        </span>

        {doc.vehicle_number && (
          <span style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Car size={12} />
            {doc.vehicle_number}
          </span>
        )}

        {doc.expiry_date && (
          <span style={{
            backgroundColor: theme.bg,
            border: `1px solid ${theme.cardBorder}`,
            color: theme.subtext,
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Clock size={12} />
            Exp: {new Date(doc.expiry_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Action Buttons Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${theme.cardBorder}`,
        flexWrap: 'wrap',
      }}>
        {/* View Scanned Lines */}
        <button
          onClick={() => onViewLines(doc)}
          style={actionBtnStyle(theme, theme.badgeBg, theme.accent)}
          title="Inspect scanned lines"
        >
          <Layers size={14} />
          Lines
        </button>

        {/* Convert Document */}
        <button
          onClick={() => onConvert(doc)}
          style={actionBtnStyle(theme, theme.bg, theme.text)}
          title="Convert to Word or HTML"
        >
          <ArrowRightLeft size={14} color={theme.secondary} />
          Convert
        </button>

        {/* Share Document */}
        <button
          onClick={handleShare}
          style={actionBtnStyle(theme, theme.bg, theme.text)}
          title="Share via Android Share Sheet"
        >
          <Share2 size={14} color={theme.accent} />
          Share
        </button>

        {/* Re-upload / Renew */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={actionBtnStyle(theme, theme.bg, theme.text)}
          title="Re-upload or renew document"
        >
          <RefreshCw size={14} color="#10b981" />
          Reupload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleReuploadChange}
          style={{ display: 'none' }}
        />

        {/* Delete */}
        <button
          onClick={() => onDelete(doc.id, doc.filename)}
          style={{
            ...actionBtnStyle(theme, 'rgba(239, 68, 68, 0.1)', '#ef4444'),
            padding: '6px 8px',
          }}
          title="Delete document"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const actionBtnStyle = (theme, bg, color) => ({
  backgroundColor: bg,
  color: color,
  border: `1px solid ${theme.cardBorder}`,
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  transition: 'opacity 0.2s',
});
