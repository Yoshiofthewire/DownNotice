const { Notification } = require('electron');
const settings = require('./settings');

let lastNotifiedItems = new Map();

function shouldNotify(feedId, itemTitle, pubDate) {
  const key = `${feedId}:${itemTitle}`;
  const lastDate = lastNotifiedItems.get(key);
  if (lastDate && lastDate === pubDate) return false;
  lastNotifiedItems.set(key, pubDate);
  return true;
}

function sendNotification(feedName, item) {
  if (!settings.get('notifications')) return;

  const notification = new Notification({
    title: feedName,
    body: `${item.title}\n${item.description.substring(0, 150)}`,
    urgency: item.status === 'down' ? 'critical' : 'normal'
  });
  notification.show();
}

function notifyNewItems(feedId, feedName, items, previousItems) {
  const prevTitles = new Set(previousItems.map(i => i.title));

  for (const item of items) {
    if (item.status === 'resolved') continue;

    if (!prevTitles.has(item.title) && shouldNotify(feedId, item.title, item.pubDate)) {
      sendNotification(feedName, item);
    }
  }
}

function clearNotificationCache() {
  lastNotifiedItems.clear();
}

module.exports = { notifyNewItems, sendNotification, clearNotificationCache };
