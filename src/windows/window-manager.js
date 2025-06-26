const { BrowserWindow, Menu } = require('electron/main');
const path = require('node:path');

class WindowManager {
  constructor() {
    this.appWindow = null;
    this.settingsWindow = null;
    this.settingsService = null;
  }

  setSettingsService(settingsService) {
    this.settingsService = settingsService;
  }

  createAppWindow(onContentUpdate) {
    this.appWindow = new BrowserWindow({
      fullscreen: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
        partition: 'persist:my-session',
      }
    });

    this.appWindow.loadFile(path.join(__dirname, '../index.html'));
    
    if (this.settingsService) {
      this.settingsService.setAppWindow(this.appWindow);
      
      const settings = this.settingsService.getSettings();
      if (settings.devTools) {
        this.appWindow.webContents.openDevTools();
      }

      this.settingsService.setupDevToolsListeners(this.appWindow);
    }

    this.appWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Escape' && this.appWindow.isFullScreen()) {
        this.appWindow.setFullScreen(false);
      }
    });

    this.setupMenu();

    this.appWindow.webContents.once('did-finish-load', () => {
      onContentUpdate();
      setInterval(onContentUpdate, 60000);
    });

    return this.appWindow;
  }

  setupMenu() {
    const menuTemplate = [
      {
        label: 'アプリ',
        submenu: [
          {
            label: '設定',
            accelerator: 'CommandOrControl+,',
            click: () => {
              this.openSettingsWindow();
            }
          },
          { type: 'separator' },
          {
            label: 'フルスクリーン終了',
            accelerator: 'Escape',
            click: () => {
              if (this.appWindow.isFullScreen()) {
                this.appWindow.setFullScreen(false);
              }
            }
          },
          { role: 'quit' },
        ]
      },
      {
        label: '編集',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      }
    ];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  openSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 400,
      height: 300,
      title: '設定',
      parent: this.appWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    if (this.settingsService) {
      this.settingsService.setSettingsWindow(this.settingsWindow);
    }

    this.settingsWindow.on('blur', () => {
      this.settingsWindow?.close();
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../settings', 'settings.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  getAppWindow() {
    return this.appWindow;
  }

  getSettingsWindow() {
    return this.settingsWindow;
  }
}

module.exports = new WindowManager();