export function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function statusLabel(status) {
  const labels = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    error: 'Error',
    resolved: 'Resolved',
    scheduled: 'Scheduled',
    unknown: 'Unknown'
  };
  return labels[status] || status;
}
