import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FileText, Search, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BottomNav({ currentTab, onChangeTab, alertCount }) {
  const { theme } = useTheme();

  const tabs = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'search', label: 'Line Search', icon: Search },
    { id: 'vault', label: 'Vault', icon: ShieldCheck },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle, badge: alertCount },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: theme.navBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${theme.cardBorder}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 4px 12px 4px',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onChangeTab(tab.id)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: isActive ? theme.accent : theme.subtext,
              cursor: 'pointer',
              position: 'relative',
              padding: '6px 0',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? theme.accent : theme.subtext} />
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5,
                  right: -8,
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: 10,
                  lineHeight: 1,
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.2px',
            }}>
              {tab.label}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 18,
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.accent,
                boxShadow: `0 0 8px ${theme.accent}`,
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
