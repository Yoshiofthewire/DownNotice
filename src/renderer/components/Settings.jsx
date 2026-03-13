import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderIcon, { AVAILABLE_ICONS } from './ProviderIcon';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('feeds');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: '', url: '', icon: 'generic', enabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    if (!window.downnotice) return;
    const s = await window.downnotice.getSettings();
    setSettings(s);
  }

  async function saveSettings(updated) {
    if (!window.downnotice) return;
    setSaving(true);
    const result = await window.downnotice.saveSettings(updated);
    setSettings(result);
    setSaving(false);
  }

  function handleAddFeed() {
    if (!newFeed.name.trim() || !newFeed.url.trim()) return;

    const id = newFeed.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const updated = {
      ...settings,
      feeds: [...settings.feeds, { ...newFeed, id }]
    };
    saveSettings(updated);
    setNewFeed({ name: '', url: '', icon: 'generic', enabled: true });
    setShowAddFeed(false);
  }

  function handleRemoveFeed(feedId) {
    const updated = {
      ...settings,
      feeds: settings.feeds.filter(f => f.id !== feedId)
    };
    saveSettings(updated);
  }

  function handleToggleFeed(feedId) {
    const updated = {
      ...settings,
      feeds: settings.feeds.map(f =>
        f.id === feedId ? { ...f, enabled: !f.enabled } : f
      )
    };
    saveSettings(updated);
  }

  if (!settings) {
    return (
      <div className="page">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      <div className="page-header" style={{ marginTop: 12 }}>
        <h1>⚙ Settings</h1>
        {saving && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Saving...</span>}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'feeds' ? 'active' : ''}`} onClick={() => setActiveTab('feeds')}>
          RSS Feeds
        </button>
        <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          General
        </button>
      </div>

      {activeTab === 'feeds' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>Configured Feeds</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddFeed(!showAddFeed)}>
              {showAddFeed ? '✕ Cancel' : '+ Add Feed'}
            </button>
          </div>

          {showAddFeed && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12 }}>Add New Feed</h4>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newFeed.name}
                  onChange={e => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder="e.g., DigitalOcean"
                />
              </div>
              <div className="form-group">
                <label>RSS/Atom URL</label>
                <input
                  type="url"
                  value={newFeed.url}
                  onChange={e => setNewFeed({ ...newFeed, url: e.target.value })}
                  placeholder="https://status.example.com/feed.rss"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <select value={newFeed.icon} onChange={e => setNewFeed({ ...newFeed, icon: e.target.value })}>
                  {AVAILABLE_ICONS.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleAddFeed}>Add Feed</button>
            </div>
          )}

          {settings.feeds.map(feed => (
            <div key={feed.id} className="settings-feed-row">
              <ProviderIcon icon={feed.icon} size={32} />
              <div className="feed-details">
                <div className="name">{feed.name}</div>
                <div className="url">{feed.url}</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={() => handleToggleFeed(feed.id)}
                />
                <span className="slider"></span>
              </label>
              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveFeed(feed.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'general' && (
        <div>
          <div className="form-group">
            <label>Refresh Interval (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={settings.refreshInterval}
              onChange={e => {
                const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 15));
                saveSettings({ ...settings, refreshInterval: val });
              }}
            />
          </div>

          <div className="form-group">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={e => {
                saveSettings({ ...settings, theme: e.target.value });
                document.documentElement.setAttribute('data-theme', e.target.value);
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="form-group">
            <label>History (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.historyHours}
              onChange={e => {
                const val = Math.max(1, Math.min(168, parseInt(e.target.value) || 48));
                saveSettings({ ...settings, historyHours: val });
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Auto-start on login</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Launch DownNotice when your computer starts</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoStart}
                onChange={() => saveSettings({ ...settings, autoStart: !settings.autoStart })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Desktop Notifications</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Show notifications for new incidents</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => saveSettings({ ...settings, notifications: !settings.notifications })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
