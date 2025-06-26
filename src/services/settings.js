const Store = require('electron-store');
const { ipcMain } = require('electron/main');

class SettingsService {
  constructor() {
    this.store = new Store();
    this.appWindow = null;
    this.settingsWindow = null;
    this.setupIPCHandlers();
  }

  setAppWindow(window) {
    this.appWindow = window;
  }

  setSettingsWindow(window) {
    this.settingsWindow = window;
  }

  setupIPCHandlers() {
    ipcMain.handle('get-settings', () => {
      return this.store.get('userSettings', {});
    });

    ipcMain.handle('get-slide-settings', () => {
      const settings = this.store.get('userSettings', {
        slide: { speed: 5 }
      });
      return settings.slide;
    });

    ipcMain.on('save-settings', (event, settings) => {
      this.saveSettings(settings);
    });

    ipcMain.on('update-slide-speed', (event, speed) => {
      this.updateSlideSpeed(speed);
    });
  }

  saveSettings(settings) {
    const currentSettings = this.store.get('userSettings', {});
    const newSettings = { ...currentSettings, ...settings };
    this.store.set('userSettings', newSettings);
    console.log('設定が保存されました:', this.store.get('userSettings'));
    
    if (settings.devTools !== undefined) {
      if (settings.devTools && this.appWindow && !this.appWindow.isDestroyed()) {
        this.appWindow.webContents.openDevTools();
      } else if (!settings.devTools && this.appWindow && !this.appWindow.isDestroyed()) {
        this.appWindow.webContents.closeDevTools();
      }
    }
    
    this.settingsWindow?.close();
  }

  updateSlideSpeed(speed) {
    const currentSettings = this.store.get('userSettings', {});
    currentSettings.slide = { speed };
    this.store.set('userSettings', currentSettings);
    
    if (this.appWindow && !this.appWindow.isDestroyed()) {
      this.appWindow.webContents.send('slide-speed-updated', speed);
    }
  }

  getSettings() {
    return this.store.get('userSettings', {});
  }

  setupDevToolsListeners(window) {
    window.webContents.on('devtools-closed', () => {
      const currentSettings = this.store.get('userSettings', {});
      currentSettings.devTools = false;
      this.store.set('userSettings', currentSettings);
      console.log('開発者ツールが閉じられました。設定を更新:', currentSettings);
    });

    window.webContents.on('devtools-opened', () => {
      const currentSettings = this.store.get('userSettings', {});
      currentSettings.devTools = true;
      this.store.set('userSettings', currentSettings);
      console.log('開発者ツールが開かれました。設定を更新:', currentSettings);
    });
  }
}

module.exports = new SettingsService();