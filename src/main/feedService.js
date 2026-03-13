const { parseFeed } = require('./feedParser');
const { notifyNewItems } = require('./notifications');
const settings = require('./settings');

let feedData = {};
let pollTimer = null;
let onUpdateCallback = null;

function setUpdateCallback(cb) {
  onUpdateCallback = cb;
}

async function fetchAllFeeds() {
  const feeds = settings.get('feeds') || [];
  const historyHours = settings.get('historyHours') || 48;
  const cutoff = new Date(Date.now() - historyHours * 60 * 60 * 1000).toISOString();

  const results = {};

  const fetchPromises = feeds
    .filter(f => f.enabled)
    .map(async feed => {
      try {
        const parsed = await parseFeed(feed.url);
        const previousItems = feedData[feed.id]?.items || [];

        const filteredItems = parsed.items.filter(item => item.pubDate >= cutoff);

        const result = {
          id: feed.id,
          name: feed.name,
          icon: feed.icon,
          url: feed.url,
          title: parsed.title,
          items: filteredItems,
          status: computeFeedStatus(filteredItems),
          lastFetch: new Date().toISOString(),
          error: null
        };

        notifyNewItems(feed.id, feed.name, filteredItems, previousItems);

        return result;
      } catch (err) {
        return {
          id: feed.id,
          name: feed.name,
          icon: feed.icon,
          url: feed.url,
          title: feed.name,
          items: feedData[feed.id]?.items || [],
          status: 'error',
          lastFetch: new Date().toISOString(),
          error: err.message
        };
      }
    });

  const feedResults = await Promise.all(fetchPromises);

  for (const result of feedResults) {
    results[result.id] = result;
  }

  feedData = results;

  if (onUpdateCallback) {
    onUpdateCallback(getOverallStatus(), feedData);
  }

  return feedData;
}

function computeFeedStatus(items) {
  const activeItems = items.filter(i => i.status !== 'resolved');
  if (activeItems.length === 0) return 'operational';

  const hasDown = activeItems.some(i => i.status === 'down');
  if (hasDown) return 'down';

  const hasDegraded = activeItems.some(i => i.status === 'degraded');
  if (hasDegraded) return 'degraded';

  return 'operational';
}

function getOverallStatus() {
  const feeds = Object.values(feedData);
  if (feeds.length === 0) return 'operational';

  const hasError = feeds.some(f => f.status === 'error');
  const hasDown = feeds.some(f => f.status === 'down');
  const hasDegraded = feeds.some(f => f.status === 'degraded');

  if (hasError) return 'error';
  if (hasDown) return 'down';
  if (hasDegraded) return 'degraded';
  return 'operational';
}

function getFeedData() {
  return feedData;
}

function startPolling() {
  stopPolling();
  const intervalMin = settings.get('refreshInterval') || 15;
  fetchAllFeeds();
  pollTimer = setInterval(fetchAllFeeds, intervalMin * 60 * 1000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function restartPolling() {
  startPolling();
}

module.exports = {
  fetchAllFeeds,
  getFeedData,
  getOverallStatus,
  startPolling,
  stopPolling,
  restartPolling,
  setUpdateCallback
};
