import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getServerUrl, setServerUrl } from '../api/client';
import { Shield, Bell, Palette, Check, Settings, Wifi, X, CheckCircle2 } from 'lucide-react';

export default function Header({ alertCount, onOpenAlerts }) {
  const { theme, currentTheme, switchTheme, availableThemes } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverAddress, setServerAddress] = useState(getServerUrl() || 'http://192.168.1.39:8000');
  const [testResult, setTestResult] = useState('');

  const handleSaveServer = () => {
    setServerUrl(serverAddress.trim());
    setTestResult('Saved! Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleTestConnection = async () => {
    setTestResult('Testing...');
    try {
      const url = serverAddress.trim().replace(/\/+$/, '') + '/api/health';
      const res = await fetch(url);
      if (res.ok) {
        setTestResult(' Connected successfully!');
      } else {
        setTestResult(`❌ Server responded with status ${res.status}`);
      }
    } catch (err) {
      setTestResult(`❌ Could not connect: ${err.message}`);
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: theme.navBg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${theme.cardBorder}`,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: `0 4px 20px ${theme.glow}`,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 16px ${theme.glow}`,
        }}>
          <Shield size={22} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.5px',
            fontFamily: "'Outfit', sans-serif",
            background: `linear-gradient(90deg, #ffffff, ${theme.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            lineHeight: 1.1,
          }}>
            KRYPTIC
          </h1>
          <span style={{ fontSize: 10, color: theme.subtext, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
            Secure Doc Engine & Vault
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Server Config for Android APK */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: theme.card,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.subtext,
          }}
          title="Backend Server Settings"
        >
          <Wifi size={16} color={theme.secondary} />
        </button>

        {/* Theme Selector Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            id="theme-toggle-btn"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            style={{
              background: theme.card,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 10,
              padding: '8px 10px',
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <Palette size={16} color={theme.accent} />
            <span style={{ textTransform: 'capitalize' }}>{availableThemes[currentTheme]?.name || 'Theme'}</span>
          </button>

          {/* Theme Dropdown Menu */}
          {showThemeMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '115%',
              width: 190,
              backgroundColor: theme.card,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 100,
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ fontSize: 11, color: theme.subtext, padding: '4px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                Select Color Mode
              </div>
              {Object.entries(availableThemes).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => {
                    switchTheme(key);
                    setShowThemeMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: currentTheme === key ? theme.badgeBg : 'transparent',
                    border: 'none',
                    color: currentTheme === key ? theme.accent : theme.text,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: currentTheme === key ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${t.accent}, ${t.secondary})`,
                      display: 'inline-block',
                    }} />
                    {t.name}
                  </div>
                  {currentTheme === key && <Check size={14} color={theme.accent} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 7-Day Expiry Notification Bell */}
        <button
          id="alerts-bell-btn"
          onClick={onOpenAlerts}
          style={{
            position: 'relative',
            background: theme.card,
            border: `1px solid ${alertCount > 0 ? theme.accent : theme.cardBorder}`,
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Vehicle & Document Expiry Alerts"
        >
          <Bell size={17} color={alertCount > 0 ? (theme.id === 'crimson' ? '#ff3344' : theme.accent) : theme.subtext} />
          {alertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              animation: 'pulse 2s infinite',
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {/* Server Settings Modal for APK */}
      {showSettings && (
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
            maxWidth: 420,
            padding: 22,
            boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wifi size={18} color={theme.secondary} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>
                  Backend Server Connection
                </h3>
              </div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: theme.subtext, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: theme.subtext, marginBottom: 14, lineHeight: 1.4 }}>
              When installed as an Android APK, enter your computer's IP address on the Wi-Fi network (or cloud backend URL).
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.subtext, marginBottom: 6 }}>
                FastAPI Backend URL
              </label>
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="http://192.168.1.39:8000"
                style={{
                  width: '100%',
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.text,
                  borderRadius: 8,
                  padding: '10px 12px',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            {testResult && (
              <div style={{
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: testResult.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: testResult.includes('✅') ? '#10b981' : '#ef4444',
                marginBottom: 14,
              }}>
                {testResult}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleTestConnection}
                style={{
                  flex: 1,
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.cardBorder}`,
                  color: theme.text,
                  padding: '10px 0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Test Ping
              </button>

              <button
                type="button"
                onClick={handleSaveServer}
                style={{
                  flex: 1,
                  backgroundColor: theme.accent,
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: `0 2px 10px ${theme.glow}`,
                }}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
