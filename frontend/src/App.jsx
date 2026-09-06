import React, { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import { api } from './api/client';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import DocumentsScreen from './screens/DocumentsScreen';
import SearchScreen from './screens/SearchScreen';
import VaultScreen from './screens/VaultScreen';
import AlertsScreen from './screens/AlertsScreen';

export default function App() {
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, notifsData] = await Promise.all([
        api.getDocuments(),
        api.getNotifications(),
      ]);
      setDocuments(docsData);
      setAlerts(notifsData.alerts || []);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (file) => {
    const res = await api.uploadDocument(file);
    await loadData();
    return res;
  };

  const handleReupload = async (docId, file) => {
    try {
      await api.reuploadDocument(docId, file);
      alert('Document renewed & re-uploaded! Expiry alerts cleared.');
      await loadData();
    } catch (err) {
      alert(`Re-upload error: ${err.message}`);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await api.deleteDocument(docId);
        await loadData();
      } catch (err) {
        alert(`Delete error: ${err.message}`);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: '100vh',
      maxWidth: 600,
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0 0 50px rgba(0,0,0,0.5)',
      fontFamily: "'Inter', sans-serif",
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      {/* Top Header with Theme Switcher & Alert Bell */}
      <Header
        alertCount={alerts.length}
        onOpenAlerts={() => setCurrentTab('alerts')}
      />

      {/* Main Content View by Active Tab */}
      <main>
        {currentTab === 'documents' && (
          <DocumentsScreen
            documents={documents}
            loading={loading}
            onUpload={handleUpload}
            onReupload={handleReupload}
            onDelete={handleDelete}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'search' && (
          <SearchScreen />
        )}

        {currentTab === 'vault' && (
          <VaultScreen />
        )}

        {currentTab === 'alerts' && (
          <AlertsScreen
            alerts={alerts}
            onReuploadDoc={handleReupload}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        alertCount={alerts.length}
      />
    </div>
  );
}
