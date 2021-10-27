const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

if (isDev) {
    require('electron-reload')(__dirname, {
        electron: require(path.join(__dirname, '/node_modules/electron'))
    });
}

app.on('ready', () => {
    const mainWindow = new BrowserWindow();
    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
    mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})