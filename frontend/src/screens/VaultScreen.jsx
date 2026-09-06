import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { 
  ShieldCheck, 
  KeyRound, 
  CreditCard, 
  Share2, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Check, 
  X,
  Lock,
  Building,
  Globe
} from 'lucide-react';

export default function VaultScreen() {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('password');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState('password');
  const [formTitle, setFormTitle] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formExtra, setFormExtra] = useState('');
  const [saving, setSaving] = useState(false);

  const loadVault = () => {
    setLoading(true);
    api.getVaultItems(activeCategory)
      .then((res) => setItems(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVault();
  }, [activeCategory]);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Remove '${title}' from encrypted vault?`)) {
      await api.deleteVaultItem(id);
      loadVault();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSecret.trim()) return;

    setSaving(true);
    try {
      await api.createVaultItem({
        category: formCategory,
        title: formTitle.trim(),
        identifier: formIdentifier.trim(),
        secret: formSecret.trim(),
        extra_meta: formExtra ? { note: formExtra } : null,
      });
      setShowAddModal(false);
      setFormTitle('');
      setFormIdentifier('');
      setFormSecret('');
      setFormExtra('');
      loadVault();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px 16px 90px 16px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        boxShadow: `0 4px 20px ${theme.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: theme.badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lock size={22} color={theme.accent} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.text }}>
              Encrypted Vault
            </h2>
            <p style={{ fontSize: 12, color: theme.subtext, margin: '2px 0 0 0' }}>
              Hardware-backed AES-256 local encrypted storage
            </p>
          </div>
        </div>

        <button
          id="add-vault-btn"
          onClick={() => {
            setFormCategory(activeCategory);
            setShowAddModal(true);
          }}
          style={{
            backgroundColor: theme.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: `0 4px 12px ${theme.glow}`,
          }}
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Tabs: Passwords, Bank Accounts, Social Links */}
      <div style={{
        display: 'flex',
        backgroundColor: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 12,
        padding: 4,
        marginBottom: 18,
      }}>
        {[
          { id: 'password', label: 'Passwords', icon: KeyRound },
          { id: 'bank_account', label: 'Bank Details', icon: CreditCard },
          { id: 'social_link', label: 'Social Links', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 6px',
                borderRadius: 8,
                backgroundColor: isActive ? theme.accent : 'transparent',
                color: isActive ? '#ffffff' : theme.subtext,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: theme.subtext }}>
          Accessing secure vault...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 14,
          padding: 40,
          textAlign: 'center',
          color: theme.subtext,
        }}>
          <p style={{ margin: 0, fontSize: 14 }}>No vault items saved under this category.</p>
        </div>
      ) : (
        items.map((item) => {
          const isRevealed = revealedIds[item.id];
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: theme.card,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
                    {item.title}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: theme.badgeBg,
                    color: theme.accent,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}>
                    AES-256
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                  title="Delete vault entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Identifier / Username / URL */}
              {item.identifier && (
                <div style={{ fontSize: 13, color: theme.subtext, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{item.identifier}</span>
                  {activeCategory === 'social_link' && item.identifier.startsWith('http') && (
                    <a
                      href={item.identifier}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: theme.secondary, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* Encrypted Secret Display */}
              <div style={{
                backgroundColor: theme.bg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
              }}>
                <span style={{ color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeCategory === 'password'
                    ? isRevealed
                      ? item.decrypted_secret
                      : '••••••••••••••••'
                    : item.decrypted_secret}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeCategory === 'password' && (
                    <button
                      onClick={() => toggleReveal(item.id)}
                      style={{ background: 'transparent', border: 'none', color: theme.subtext, cursor: 'pointer' }}
                      title={isRevealed ? 'Hide' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(item.decrypted_secret, item.id)}
                    style={{ background: 'transparent', border: 'none', color: isCopied ? '#10b981' : theme.accent, cursor: 'pointer' }}
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Extra Metadata (Bank IFSC, notes, etc.) */}
              {item.meta && Object.keys(item.meta).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {Object.entries(item.meta).map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        fontSize: 11,
                        color: theme.subtext,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add New Item Modal */}
      {showAddModal && (
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
            padding: 24,
            boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${theme.glow}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
                Add to Encrypted Vault
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: theme.subtext, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.subtext, marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.cardBorder}`,
                    color: theme.text,
                    borderRadius: 8,
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: 13,
                  }}
                >
                  <option value="password">Password / Credentials</option>
                  <option value="bank_account">Bank Account / Card</option>
                  <option value="social_link">Social Media Link (LinkedIn, Instagram, GitHub)</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.subtext, marginBottom: 6 }}>
                  Title / Service
                </label>
                <input
                  type="text"
                  placeholder={formCategory === 'password' ? 'e.g. Netflix, AWS, GitHub' : formCategory === 'bank_account' ? 'e.g. Chase Checking, HDFC' : 'e.g. LinkedIn, Instagram, GitHub'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.cardBorder}`,
                    color: theme.text,
                    borderRadius: 8,
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.subtext, marginBottom: 6 }}>
                  {formCategory === 'password' ? 'Username / Email' : formCategory === 'bank_account' ? 'Account Holder / Branch' : 'Profile URL'}
                </label>
                <input
                  type="text"
                  placeholder={formCategory === 'social_link' ? 'https://linkedin.com/in/username' : 'Identifier / Email'}
                  value={formIdentifier}
                  onChange={(e) => setFormIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.cardBorder}`,
                    color: theme.text,
                    borderRadius: 8,
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.subtext, marginBottom: 6 }}>
                  {formCategory === 'password' ? 'Password (Encrypted)' : formCategory === 'bank_account' ? 'Account Number / Card CVV' : 'Handle / Notes'}
                </label>
                <input
                  type={formCategory === 'password' ? 'password' : 'text'}
                  placeholder="Secret value to encrypt"
                  value={formSecret}
                  onChange={(e) => setFormSecret(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.cardBorder}`,
                    color: theme.text,
                    borderRadius: 8,
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: 13,
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  backgroundColor: theme.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 16px ${theme.glow}`,
                }}
              >
                {saving ? 'Encrypting & Storing...' : 'Save to Vault'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
