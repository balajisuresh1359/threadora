const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  openFile: (filePath) => ipcRenderer.invoke('shell:openFile', filePath)
});
