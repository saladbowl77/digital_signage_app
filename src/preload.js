const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electronAPI', {
  // アプリ設定に関する記述
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  getSlideSettings: () => ipcRenderer.invoke('get-slide-settings'),
  
  // メインプロセスからコンテンツを取得
  fetchContents: () => ipcRenderer.invoke('fetch-contents'),
  
  // メインプロセスからのコンテンツ更新を受信
  onContentUpdated: (callback) => {
    ipcRenderer.on('content-updated', (event, data) => callback(data));
  },
  
  // スライド速度更新を受信
  onSlideSpeedUpdated: (callback) => {
    ipcRenderer.on('slide-speed-updated', (event, speed) => callback(speed));
  },
  
  // リスナーを削除
  removeContentUpdatedListener: () => {
    ipcRenderer.removeAllListeners('content-updated');
  }
})

