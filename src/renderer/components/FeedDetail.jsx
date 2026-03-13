import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProviderIcon from './ProviderIcon';
import { formatTime, statusLabel } from '../utils/helpers';

export default function FeedDetail() {
  const { feedId } = useParams();
  const navigate = useNavigate();
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    loadFeed();

    if (window.downnotice) {
      window.downnotice.onFeedUpdate((data) => {
        if (data.feeds[feedId]) {
          setFeed(data.feeds[feedId]);
        }
      });
    }
  }, [feedId]);

  async function loadFeed() {
    if (!window.downnotice) return;
    const feeds = await window.downnotice.getFeeds();
    if (feeds[feedId]) {
      setFeed(feeds[feedId]);
    }
  }

  if (!feed) {
    return (
      <div className="page">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
        <div className="empty-state">
          <p>Loading feed data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProviderIcon icon={feed.icon} size={36} />
          <div>
            <h1>{feed.name}</h1>
            <span className={`status-badge ${feed.status}`}>
              {statusLabel(feed.status)}
            </span>
          </div>
        </div>
      </div>

      {feed.error && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--red)' }}>⚠ Feed Error:</strong> {feed.error}
        </div>
      )}

      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>
        Feed URL: {feed.url}<br />
        Last fetched: {feed.lastFetch ? formatTime(feed.lastFetch) : 'Never'}
      </p>

      <h2 style={{ fontSize: 17, marginBottom: 12 }}>Incidents (Last 48 Hours)</h2>

      {feed.items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>No incidents reported</p>
        </div>
      ) : (
        feed.items
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .map((item, idx) => (
            <div key={idx} className="card" style={{ cursor: 'default' }}>
              <div className="item-title">
                <span className={`status-dot ${item.status}`}></span>
                <span style={{ flex: 1 }}>{item.title}</span>
                <span className={`status-badge ${item.status}`} style={{ marginLeft: 8 }}>
                  {statusLabel(item.status)}
                </span>
              </div>
              {item.description && (
                <div className="item-description" style={{ marginTop: 8 }}>
                  {item.description}
                </div>
              )}
              <div className="item-time" style={{ marginTop: 6 }}>
                {formatTime(item.pubDate)}
                {item.link && (
                  <> • <a href={item.link} target="_blank" rel="noopener noreferrer">View details ↗</a></>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
