const { ipcRenderer } = require('electron');

// 設定読み込み
window.addEventListener('DOMContentLoaded', async () => {
  const settings = await ipcRenderer.invoke('get-settings');
  if (settings) {
    document.getElementById('slideSpeed').value = settings.slide?.speed || 5;
    document.getElementById('devTools').checked = settings.devTools || false;
    document.getElementById('serviceDomain').value = settings.microcms?.serviceDomain || '';
    document.getElementById('apiKey').value = settings.microcms?.apiKey || '';
    document.getElementById('endpoint').value = settings.microcms?.endpoint || 'contents';
  }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const slideSpeed = parseInt(document.getElementById('slideSpeed').value);
  const devTools = document.getElementById('devTools').checked;
  const serviceDomain = document.getElementById('serviceDomain').value;
  const apiKey = document.getElementById('apiKey').value;
  const endpoint = document.getElementById('endpoint').value;
  
  ipcRenderer.send('save-settings', { 
    slide: { speed: slideSpeed },
    devTools,
    microcms: {
      serviceDomain,
      apiKey,
      endpoint
    }
  });
  
  ipcRenderer.send('update-slide-speed', slideSpeed);
});
