import React, { useState, useEffect } from 'react';
import ProviderIcon from './ProviderIcon';
import { formatTime, statusLabel } from '../utils/helpers';

export default function Popover() {
  const [feeds, setFeeds] = useState({});
  const [overallStatus, setOverallStatus] = useState('operational');

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

  function openDashboard() {
    if (window.downnotice) {
      window.downnotice.openMainWindow('dashboard');
    }
  }

  function openFeed(feedId) {
    if (window.downnotice) {
      window.downnotice.openMainWindow(`feed/${feedId}`);
    }
  }

  const feedList = Object.values(feeds);

  return (
    <div className="popover-container">
      <div className="popover-header">
        <h2>DownNotice</h2>
        <span className={`status-badge ${overallStatus}`}>
          <span className={`status-dot ${overallStatus}`}></span>
          {statusLabel(overallStatus)}
        </span>
      </div>
      <div className="popover-body">
        {feedList.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📡</div>
            <p>Loading feeds...</p>
          </div>
        ) : (
          feedList.map(feed => (
            <div
              key={feed.id}
              className="popover-feed"
              onClick={() => openFeed(feed.id)}
            >
              <ProviderIcon icon={feed.icon} size={32} />
              <div className="feed-info">
                <div className="name">{feed.name}</div>
                <div className="last-update">
                  {feed.items.length > 0
                    ? `Latest: ${feed.items[0].title.substring(0, 50)}`
                    : 'No recent incidents'
                  }
                </div>
              </div>
              <span className={`status-dot ${feed.status}`}></span>
            </div>
          ))
        )}

        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <button className="btn btn-sm" onClick={openDashboard} style={{ width: '100%', justifyContent: 'center' }}>
            Open Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
