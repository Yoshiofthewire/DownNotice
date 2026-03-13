const { XMLParser } = require('fast-xml-parser');
const fetch = require('node-fetch');
const https = require('https');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

// Custom agent to handle corporate TLS inspection proxies
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Parse an RSS or Atom feed from a URL.
 * Returns normalized array of feed items.
 */
async function parseFeed(feedUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DownNotice/1.0' },
      agent: feedUrl.startsWith('https') ? httpsAgent : undefined
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const data = parser.parse(text);

    if (data.rss) {
      return parseRSS(data.rss);
    } else if (data.feed) {
      return parseAtom(data.feed);
    } else {
      throw new Error('Unknown feed format');
    }
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function parseRSS(rss) {
  const channel = rss.channel || {};
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

  return {
    title: channel.title || 'Unknown Feed',
    items: items.map(item => ({
      title: item.title || '',
      description: stripHtml(item.description || ''),
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      status: detectStatus(item.title, item.description)
    }))
  };
}

function parseAtom(feed) {
  const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];

  return {
    title: feed.title || 'Unknown Feed',
    items: entries.map(entry => {
      const link = Array.isArray(entry.link)
        ? (entry.link.find(l => l['@_rel'] === 'alternate') || entry.link[0])
        : entry.link;
      const href = typeof link === 'object' ? link['@_href'] : link || '';

      return {
        title: typeof entry.title === 'object' ? entry.title['#text'] || '' : entry.title || '',
        description: stripHtml(
          entry.content
            ? (typeof entry.content === 'object' ? entry.content['#text'] || '' : entry.content)
            : entry.summary
              ? (typeof entry.summary === 'object' ? entry.summary['#text'] || '' : entry.summary)
              : ''
        ),
        link: href,
        pubDate: entry.updated || entry.published
          ? new Date(entry.updated || entry.published).toISOString()
          : new Date().toISOString(),
        status: detectStatus(
          typeof entry.title === 'object' ? entry.title['#text'] : entry.title,
          entry.content || entry.summary || ''
        )
      };
    })
  };
}

function detectStatus(title = '', description = '') {
  const titleText = (typeof title === 'string' ? title : '').toLowerCase();
  const descRaw = (typeof description === 'object' ? JSON.stringify(description) : description || '').toLowerCase();

  // Status page feeds (GitHub, Cloudflare, etc.) put the latest update first
  // with a <strong>State</strong> marker. The raw XML may have real HTML or
  // HTML entities, so we check both forms.
  const strongMatch = descRaw.match(/<strong>\s*([^<]+)\s*<\/strong>/)
    || descRaw.match(/&lt;strong&gt;\s*([^&]+)\s*&lt;\/strong&gt;/);
  const latestMarker = strongMatch ? strongMatch[1].trim() : '';

  // If the latest update marker indicates resolved/completed/scheduled, trust it
  const resolvedMarkers = ['resolved', 'completed', 'fixed', 'recovered', 'restored', 'postmortem'];
  const scheduledMarkers = ['scheduled', 'this is a scheduled event'];

  for (const marker of scheduledMarkers) {
    if (latestMarker.includes(marker)) return 'scheduled';
  }
  for (const marker of resolvedMarkers) {
    if (latestMarker.includes(marker)) return 'resolved';
  }

  // No resolution marker found — check title and full text for active severity
  const fullText = `${titleText} ${descRaw}`;

  const degradedKeywords = ['degraded', 'partial', 'intermittent', 'elevated', 'delays', 'slow', 'minor', 'investigating'];
  const downKeywords = ['outage', 'unavailable', 'major', 'disruption', 'failure', 'emergency', 'critical'];
  const maintenanceKeywords = ['maintenance', 'scheduled'];

  // Check degraded before down — "degraded" is a specific status, while
  // down keywords like "disruption" often appear in degraded incidents too
  for (const keyword of degradedKeywords) {
    if (fullText.includes(keyword)) return 'degraded';
  }
  for (const keyword of downKeywords) {
    if (fullText.includes(keyword)) return 'down';
  }
  for (const keyword of maintenanceKeywords) {
    if (fullText.includes(keyword)) return 'scheduled';
  }

  // Check for resolved keywords in title as fallback
  const resolvedKeywords = ['resolved', 'recovered', 'restored', 'completed', 'operational', 'fixed', 'back to normal'];
  for (const keyword of resolvedKeywords) {
    if (titleText.includes(keyword)) return 'resolved';
  }

  return 'unknown';
}

function stripHtml(html) {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

module.exports = { parseFeed, detectStatus };
