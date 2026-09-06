import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import DocCard from '../components/DocCard';
import LinesModal from '../components/LinesModal';
import ConvertModal from '../components/ConvertModal';
import { Upload, Plus, FileUp, Sparkles, Filter, CheckCircle2, Loader2 } from 'lucide-react';

export default function DocumentsScreen({ documents, loading, onUpload, onReupload, onDelete, onRefresh }) {
  const { theme } = useTheme();
  const [selectedLinesDoc, setSelectedLinesDoc] = useState(null);
  const [selectedConvertDoc, setSelectedConvertDoc] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess('');
    try {
      await onUpload(file);
      setUploadSuccess(`Scanned & indexed "${file.name}" line-by-line!`);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const categories = ['ALL', 'Vehicle Pollution (PUC)', 'Vehicle Insurance Policy', 'Vehicle Registration (RC)', 'General Document'];

  const filteredDocs = documents.filter((doc) => {
    if (activeFilter === 'ALL') return true;
    return doc.category.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      {/* Upload Banner */}
      <div style={{
        backgroundColor: theme.card,
        border: `1px dashed ${theme.accent}`,
        borderRadius: 16,
        padding: '20px 16px',
        textAlign: 'center',
        marginBottom: 20,
        boxShadow: `0 4px 20px ${theme.glow}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: theme.badgeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto',
        }}>
          {uploading ? (
            <Loader2 size={24} color={theme.accent} className="spin" />
          ) : (
            <Upload size={24} color={theme.accent} />
          )}
        </div>

        <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: theme.text }}>
          {uploading ? 'Scanning Lines with OCR...' : 'Upload & Scan Any Document'}
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: 12, color: theme.subtext }}>
          Supports PDF, Word (DOCX), Images, Text. Extracts all text line-by-line.
        </p>

        <button
          id="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            backgroundColor: theme.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: `0 4px 14px ${theme.glow}`,
            opacity: uploading ? 0.7 : 1,
          }}
        >
          <FileUp size={16} />
          {uploading ? 'Processing Document...' : 'Choose File to Upload'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.csv"
        />

        {uploadSuccess && (
          <div style={{
            marginTop: 12,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <CheckCircle2 size={16} />
            {uploadSuccess}
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 12,
        marginBottom: 16,
        scrollbarWidth: 'none',
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              whiteSpace: 'nowrap',
              backgroundColor: activeFilter === cat ? theme.accent : theme.card,
              color: activeFilter === cat ? '#ffffff' : theme.subtext,
              border: `1px solid ${activeFilter === cat ? theme.accent : theme.cardBorder}`,
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {cat === 'ALL' ? 'All Documents' : cat}
          </button>
        ))}
      </div>

      {/* Document Count Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text }}>
          Documents ({filteredDocs.length})
        </h4>
        <button
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.secondary,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: theme.subtext }}>
          Loading scanned documents...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: 40,
          textAlign: 'center',
          color: theme.subtext,
        }}>
          <p style={{ margin: 0, fontSize: 14 }}>No documents found under this filter.</p>
        </div>
      ) : (
        filteredDocs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            onViewLines={(d) => setSelectedLinesDoc(d)}
            onConvert={(d) => setSelectedConvertDoc(d)}
            onReupload={onReupload}
            onDelete={onDelete}
          />
        ))
      )}

      {/* Modals */}
      {selectedLinesDoc && (
        <LinesModal doc={selectedLinesDoc} onClose={() => setSelectedLinesDoc(null)} />
      )}
      {selectedConvertDoc && (
        <ConvertModal doc={selectedConvertDoc} onClose={() => setSelectedConvertDoc(null)} />
      )}
    </div>
  );
}
