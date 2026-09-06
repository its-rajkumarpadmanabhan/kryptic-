export function getServerUrl() {
  const saved = localStorage.getItem('kryptic_server_url');
  if (saved) return saved.replace(/\/+$/, '');

  // Detect if running inside Capacitor APK on mobile device
  const isCapacitor = window.location.protocol === 'capacitor:' || 
                      window.location.hostname === 'localhost' && window.location.port === '';
  
  if (isCapacitor) {
    // Android device accessing host machine on local Wi-Fi
    return 'http://192.168.1.39:8000';
  }

  // Running inside browser with Vite dev proxy
  return '';
}

export function setServerUrl(url) {
  if (!url) {
    localStorage.removeItem('kryptic_server_url');
  } else {
    localStorage.setItem('kryptic_server_url', url.replace(/\/+$/, ''));
  }
}

export async function fetchJson(endpoint, options = {}) {
  const server = getServerUrl();
  const url = `${server}${endpoint}`;
  
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorText = 'API Request Failed';
    try {
      const err = await res.json();
      errorText = err.detail || err.message || errorText;
    } catch {
      errorText = await res.text();
    }
    throw new Error(errorText);
  }
  return res.json();
}

export const api = {
  getDocuments: () => fetchJson('/api/documents'),
  
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  reuploadDocument: (docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson(`/api/documents/${docId}/reupload`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteDocument: (docId) => 
    fetchJson(`/api/documents/${docId}`, { method: 'DELETE' }),

  convertDocument: (docId, format) => 
    fetchJson(`/api/documents/${docId}/convert?format=${format}`, { method: 'POST' }),

  getDocumentLines: (docId) => 
    fetchJson(`/api/documents/${docId}/lines`),

  searchLines: (q) => 
    fetchJson(`/api/documents/search?q=${encodeURIComponent(q)}`),

  getNotifications: () => 
    fetchJson('/api/notifications'),

  getVaultItems: (category = '') => 
    fetchJson(`/api/vault${category ? `?category=${category}` : ''}`),

  createVaultItem: ({ category, title, identifier, secret, extra_meta }) => {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('title', title);
    if (identifier) formData.append('identifier', identifier);
    formData.append('secret', secret);
    if (extra_meta) formData.append('extra_meta', typeof extra_meta === 'string' ? extra_meta : JSON.stringify(extra_meta));
    return fetchJson('/api/vault', {
      method: 'POST',
      body: formData,
    });
  },

  deleteVaultItem: (id) => 
    fetchJson(`/api/vault/${id}`, { method: 'DELETE' }),

  seedData: () => 
    fetchJson('/api/seed', { method: 'POST' })
};
