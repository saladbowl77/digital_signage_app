const { app, ipcMain } = require('electron/main');
const microCMSService = require('./services/microcms');
const settingsService = require('./services/settings');
const windowManager = require('./windows/window-manager');

// レンダラープロセスからのリクエストに応答
ipcMain.handle('fetch-contents', async () => {
  return await microCMSService.fetchContents();
});

// 定期的にレンダラープロセスにデータを送信
async function sendContentUpdate() {
  const data = await microCMSService.fetchContents();
  const appWindow = windowManager.getAppWindow();
  if (appWindow && !appWindow.isDestroyed()) {
    appWindow.webContents.send('content-updated', data);
  }
}

app.whenReady().then(() => {
  // microCMSクライアントを初期化
  microCMSService.initialize();
  
  // サービス間の依存関係を設定
  windowManager.setSettingsService(settingsService);
  
  // ウィンドウを作成
  windowManager.createAppWindow(sendContentUpdate);

  // メニューやボタンから呼び出す用に expose しておく
  global.openSettingsWindow = () => {
    windowManager.openSettingsWindow();
  };
});
