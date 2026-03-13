const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('downnotice', {
  getFeeds: () => ipcRenderer.invoke('get-feeds'),
  getOverallStatus: () => ipcRenderer.invoke('get-overall-status'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  refreshFeeds: () => ipcRenderer.invoke('refresh-feeds'),
  openMainWindow: (route) => ipcRenderer.invoke('open-main-window', route),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  onFeedUpdate: (callback) => {
    ipcRenderer.on('feed-update', (event, data) => callback(data));
  },
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, route) => callback(route));
  }
});
