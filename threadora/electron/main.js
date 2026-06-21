const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile(path.join(__dirname, '../build/index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    })
    if (canceled) {
      return null
    } else {
      return {
        path: filePaths[0],
        name: path.basename(filePaths[0])
      }
    }
  })

  ipcMain.handle('shell:openFile', async (event, filePath) => {
    shell.showItemInFolder(filePath)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
