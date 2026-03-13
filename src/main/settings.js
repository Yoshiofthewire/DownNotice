const fs = require('fs');
const path = require('path');
const os = require('os');

function getSettingsDir() {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'DownNotice');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'DownNotice');
  } else {
    return path.join(os.homedir(), '.DownNotice');
  }
}

function getSettingsPath() {
  return path.join(getSettingsDir(), 'settings.json');
}

const DEFAULT_SETTINGS = {
  feeds: [
    {
      id: 'azure',
      name: 'Microsoft Azure',
      url: 'https://azure.status.microsoft/en-us/status/feed/',
      icon: 'azure',
      enabled: true
    },
    {
      id: 'aws',
      name: 'Amazon Web Services',
      url: 'https://status.aws.amazon.com/rss/all.rss',
      icon: 'aws',
      enabled: true
    },
    {
      id: 'gcp',
      name: 'Google Cloud Platform',
      url: 'https://status.cloud.google.com/en/feed.atom',
      icon: 'gcp',
      enabled: true
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://www.githubstatus.com/history.rss',
      icon: 'github',
      enabled: true
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      url: 'https://www.cloudflarestatus.com/history.atom',
      icon: 'cloudflare',
      enabled: true
    }
  ],
  refreshInterval: 15,
  theme: 'system',
  historyHours: 48,
  autoStart: true,
  notifications: true
};

class SettingsManager {
  constructor() {
    this.settings = null;
    this.settingsPath = getSettingsPath();
    this.settingsDir = getSettingsDir();
  }

  load() {
    try {
      if (!fs.existsSync(this.settingsDir)) {
        fs.mkdirSync(this.settingsDir, { recursive: true });
      }
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      this.settings = { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }

  save() {
    try {
      if (!fs.existsSync(this.settingsDir)) {
        fs.mkdirSync(this.settingsDir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  get(key) {
    if (!this.settings) this.load();
    return this.settings[key];
  }

  set(key, value) {
    if (!this.settings) this.load();
    this.settings[key] = value;
    this.save();
  }

  getAll() {
    if (!this.settings) this.load();
    return { ...this.settings };
  }

  updateAll(newSettings) {
    if (!this.settings) this.load();
    this.settings = { ...this.settings, ...newSettings };
    this.save();
    return this.settings;
  }
}

module.exports = new SettingsManager();
