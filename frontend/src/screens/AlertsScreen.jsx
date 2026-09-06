import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, 
  AlertTriangle, 
  Car, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AlertsScreen({ alerts, onReuploadDoc, onRefresh }) {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);
  const activeReuploadId = useRef(null);

  const handleRenewClick = (docId) => {
    activeReuploadId.current = docId;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && activeReuploadId.current) {
      onReuploadDoc(activeReuploadId.current, file);
      activeReuploadId.current = null;
    }
  };

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      {/* Header Info */}
      <div style={{
        backgroundColor: theme.card,
        border: `1px solid ${alerts.length > 0 ? '#ef4444' : theme.cardBorder}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        boxShadow: alerts.length > 0 ? '0 4px 24px rgba(239, 68, 68, 0.25)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: alerts.length > 0 ? 'rgba(239, 68, 68, 0.15)' : theme.badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldAlert size={22} color={alerts.length > 0 ? '#ef4444' : theme.accent} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.text }}>
              Expiry Notification Engine
            </h2>
            <p style={{ fontSize: 12, color: theme.subtext, margin: '2px 0 0 0' }}>
              Active 7-day advance warnings for vehicle PUC, insurance & documents
            </p>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Alerts Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text }}>
          Active Alerts ({alerts.length})
        </h3>
        <button
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', color: theme.secondary, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
        >
          Check Now
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: 40,
          textAlign: 'center',
          color: theme.subtext,
        }}>
          <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 12 }} />
          <h4 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#10b981', fontWeight: 700 }}>
            All Documents Up to Date!
          </h4>
          <p style={{ margin: 0, fontSize: 13 }}>
            No vehicle policies or documents are expiring within 7 days.
          </p>
        </div>
      ) : (
        alerts.map((alert, idx) => {
          const isOverdue = alert.status === 'OVERDUE';
          const isToday = alert.status === 'CRITICAL';

          return (
            <div
              key={idx}
              style={{
                backgroundColor: theme.card,
                border: `1px solid ${isOverdue ? '#ef4444' : '#f59e0b'}`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 14,
                boxShadow: isOverdue
                  ? '0 4px 16px rgba(239, 68, 68, 0.2)'
                  : '0 4px 16px rgba(245, 158, 11, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={18} color={isOverdue ? '#ef4444' : '#f59e0b'} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: isOverdue ? '#ef4444' : '#f59e0b' }}>
                    {alert.title}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: isOverdue ? '#ef4444' : '#f59e0b',
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                }}>
                  {isOverdue ? 'EXPIRED' : isToday ? 'TODAY' : `${alert.days_left} Days Left`}
                </span>
              </div>

              <p style={{ margin: '0 0 12px 0', fontSize: 13, color: theme.text, lineHeight: 1.5 }}>
                {alert.description}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: `1px solid ${theme.cardBorder}`,
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {alert.vehicle_number && (
                    <span style={{
                      fontSize: 11,
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Car size={12} />
                      {alert.vehicle_number}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: theme.subtext }}>
                    Target: {alert.filename}
                  </span>
                </div>

                <button
                  onClick={() => handleRenewClick(alert.document_id)}
                  style={{
                    backgroundColor: theme.accent,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: `0 2px 10px ${theme.glow}`,
                  }}
                >
                  <RefreshCw size={13} />
                  Renew / Upload New
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
