const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const isDev = require('electron-is-dev');

let mainWindow;

if(isDev) {
    require('electron-reload')(__dirname, {
        electron: require(path.join(__dirname, '/node_modules/electron'))
    });
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    });
    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
    if(isDev){
        mainWindow.webContents.openDevTools();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('save-rp', async (e, data) => {
    let r = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Preset As',
        defaultPath: '',
        filters: [{
            name: 'JSON Files',
            extensions: ['*.json']
        }, {
            name: 'All Files',
            extensions: ['*.*']
        }]
    });
    if(r.canceled) return;
    let file = r.filePath;
    await fs.writeFile(file, data);
});

ipcMain.on('export-img', async (e, data) => {
    let r = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Image As',
        defaultPath: '',
        filters: [{
            name: 'PNG Files',
            extensions: ['*.png']
        }, {
            name: 'All Files',
            extensions: ['*.*']
        }]
    });
    if(r.canceled) return;
    let file = r.filePath;
    await fs.writeFile(file, data);
});