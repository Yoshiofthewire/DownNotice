import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderIcon from './ProviderIcon';
import { formatTime, statusLabel } from '../utils/helpers';

export default function Dashboard() {
  const [feeds, setFeeds] = useState({});
  const [overallStatus, setOverallStatus] = useState('operational');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    if (window.downnotice) {
      window.downnotice.onFeedUpdate((data) => {
        setOverallStatus(data.status);
        setFeeds(data.feeds);
      });
    }
  }, []);

  async function loadData() {
    if (!window.downnotice) return;
    const [feedData, status] = await Promise.all([
      window.downnotice.getFeeds(),
      window.downnotice.getOverallStatus()
    ]);
    setFeeds(feedData);
    setOverallStatus(status);
  }

  async function handleRefresh() {
    if (window.downnotice) {
      const data = await window.downnotice.refreshFeeds();
      setFeeds(data);
      const status = await window.downnotice.getOverallStatus();
      setOverallStatus(status);
    }
  }

  const feedList = Object.values(feeds);

  // Build timeline of all items across all feeds, sorted by date
  const allItems = feedList.flatMap(feed =>
    feed.items.map(item => ({
      ...item,
      feedId: feed.id,
      feedName: feed.name,
      feedIcon: feed.icon
    }))
  ).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <span className={`status-dot ${overallStatus}`}></span>
          DownNotice
        </h1>
        <div className="nav-buttons">
          <button className="btn btn-sm" onClick={handleRefresh}>↻ Refresh</button>
          <button className="btn btn-sm" onClick={() => navigate('/settings')}>⚙ Settings</button>
          <button className="btn btn-sm" onClick={() => navigate('/about')}>ℹ About</button>
        </div>
      </div>

      {/* Feed summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, marginBottom: 24 }}>
        {feedList.map(feed => (
          <div key={feed.id} className="card card-clickable" onClick={() => navigate(`/feed/${feed.id}`)}>
            <div className="card-header">
              <ProviderIcon icon={feed.icon} />
              <span className="feed-name">{feed.name}</span>
              <span className={`status-badge ${feed.status}`}>
                {statusLabel(feed.status)}
              </span>
            </div>
            {feed.error && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>⚠ {feed.error}</div>
            )}
            {feed.items.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {feed.items.filter(i => i.status !== 'resolved').length} active incident(s),{' '}
                {feed.items.length} total in 48h
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <h2 style={{ fontSize: 17, marginBottom: 12 }}>Recent Timeline</h2>
      {allItems.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>No incidents in the last 48 hours</p>
        </div>
      ) : (
        allItems.map((item, idx) => (
          <div key={`${item.feedId}-${idx}`} className="feed-item">
            <div className="item-title">
              <span className={`status-dot ${item.status}`}></span>
              <ProviderIcon icon={item.feedIcon} size={20} />
              <span style={{ marginLeft: 6, flex: 1 }}>{item.title}</span>
            </div>
            {item.description && (
              <div className="item-description">{item.description.substring(0, 200)}</div>
            )}
            <div className="item-time">
              {item.feedName} • {formatTime(item.pubDate)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
