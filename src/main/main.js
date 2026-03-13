const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
const settings = require('./settings');
const feedService = require('./feedService');

let tray = null;
let mainWindow = null;
let popoverWindow = null;
let isQuitting = false;

const isDev = !app.isPackaged;

if (process.platform === 'win32') {
  app.setAppUserModelId('DownNotice');
}

const autoLauncher = new AutoLaunch({
  name: 'DownNotice',
  isHidden: true
});

const buildDate = process.env.BUILD_DATE || new Date().toISOString().split('T')[0];

function getIconsDir() {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'assets', 'icons');
  }
  return path.join(process.resourcesPath, 'icons');
}

function createTrayIcon(status) {
  const iconsDir = getIconsDir();
  const iconFile = {
    operational: 'tray-green.png',
    degraded: 'tray-yellow.png',
    down: 'tray-red.png',
    error: 'tray-black.png'
  }[status] || 'tray-green.png';

  return nativeImage.createFromPath(path.join(iconsDir, iconFile));
}

function createTray() {
  tray = new Tray(createTrayIcon('operational'));
  tray.setToolTip('DownNotice - Monitoring cloud services');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open DownNotice', click: () => showMainWindow() },
    { label: 'Refresh Now', click: () => feedService.fetchAllFeeds() },
    { type: 'separator' },
    { label: 'Settings', click: () => showMainWindow('settings') },
    { label: 'About', click: () => showMainWindow('about') },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', (event, bounds) => {
    togglePopover(bounds);
  });
}

function togglePopover(trayBounds) {
  if (popoverWindow && popoverWindow.isVisible()) {
    popoverWindow.hide();
    return;
  }

  if (!popoverWindow) {
    createPopoverWindow();
  }

  const { x, y } = calculatePopoverPosition(trayBounds);
  popoverWindow.setPosition(x, y, false);
  popoverWindow.show();
  popoverWindow.focus();

  popoverWindow.webContents.send('feed-update', {
    status: feedService.getOverallStatus(),
    feeds: feedService.getFeedData()
  });
}

function calculatePopoverPosition(trayBounds) {
  const popoverBounds = { width: 360, height: 420 };
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const workArea = display.workArea;

  let x = Math.round(trayBounds.x - popoverBounds.width / 2 + trayBounds.width / 2);
  let y;

  if (trayBounds.y < workArea.y + workArea.height / 2) {
    y = Math.round(trayBounds.y + trayBounds.height + 4);
  } else {
    y = Math.round(trayBounds.y - popoverBounds.height - 4);
  }

  if (x + popoverBounds.width > workArea.x + workArea.width) {
    x = workArea.x + workArea.width - popoverBounds.width;
  }
  if (x < workArea.x) x = workArea.x;

  return { x, y };
}

function createPopoverWindow() {
  popoverWindow = new BrowserWindow({
    width: 360,
    height: 420,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = isDev
    ? 'http://localhost:9000/#/popover'
    : `file://${path.join(__dirname, '..', '..', 'build', 'index.html')}#/popover`;
  popoverWindow.loadURL(url);

  popoverWindow.on('blur', () => {
    if (popoverWindow && popoverWindow.isVisible()) {
      popoverWindow.hide();
    }
  });

  popoverWindow.on('closed', () => {
    popoverWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    show: false,
    title: 'DownNotice',
    icon: createTrayIcon('operational'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = isDev
    ? 'http://localhost:9000/#/dashboard'
    : `file://${path.join(__dirname, '..', '..', 'build', 'index.html')}#/dashboard`;
  mainWindow.loadURL(url);

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showMainWindow(route) {
  if (!mainWindow) {
    createMainWindow();
  }

  if (route) {
    mainWindow.webContents.send('navigate', route);
  }

  mainWindow.show();
  mainWindow.focus();
}

function updateTrayIcon(status) {
  if (tray) {
    tray.setImage(createTrayIcon(status));
    const tooltips = {
      operational: 'DownNotice - All services operational',
      degraded: 'DownNotice - Some services degraded',
      down: 'DownNotice - Service outage detected',
      error: 'DownNotice - Feed fetch error'
    };
    tray.setToolTip(tooltips[status] || 'DownNotice');
  }
}

// IPC Handlers
function setupIPC() {
  ipcMain.handle('get-feeds', () => feedService.getFeedData());
  ipcMain.handle('get-overall-status', () => feedService.getOverallStatus());
  ipcMain.handle('get-settings', () => settings.getAll());
  ipcMain.handle('save-settings', (event, newSettings) => {
    const updated = settings.updateAll(newSettings);
    feedService.restartPolling();
    updateAutoLaunch(updated.autoStart);
    return updated;
  });
  ipcMain.handle('refresh-feeds', () => feedService.fetchAllFeeds());
  ipcMain.handle('open-main-window', (event, route) => showMainWindow(route));
  ipcMain.handle('get-app-info', () => ({
    name: 'DownNotice',
    version: app.getVersion(),
    buildDate
  }));
}

function updateAutoLaunch(enabled) {
  if (enabled) {
    autoLauncher.enable().catch(err => console.error('Auto-launch enable error:', err));
  } else {
    autoLauncher.disable().catch(err => console.error('Auto-launch disable error:', err));
  }
}

// App lifecycle
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  settings.load();
  setupIPC();
  createTray();

  feedService.setUpdateCallback((status, feeds) => {
    updateTrayIcon(status);

    if (popoverWindow && popoverWindow.isVisible()) {
      popoverWindow.webContents.send('feed-update', { status, feeds });
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('feed-update', { status, feeds });
    }
  });

  feedService.startPolling();
  updateAutoLaunch(settings.get('autoStart'));
});

app.on('window-all-closed', (e) => {
  // Keep running in tray
});

app.on('before-quit', () => {
  isQuitting = true;
  feedService.stopPolling();
});

app.on('activate', () => {
  showMainWindow();
});
