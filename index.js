const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const render = require('svg-render');
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
        // mainWindow.webContents.openDevTools();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('save-rp', async (e, data) => {
    data = JSON.stringify(data);
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

function parseFileName(tmp, rp){
    tmp = tmp.replace(/{type}/g, rp.type == 0 ? 'Prism' : (rp.type == 1 ? 'Ring' : 'Cylinder'))
        .replace(/{w}/g, rp.dim.width?.toString())
        .replace(/{h}/g, rp.dim.height?.toString())
        .replace(/{d}/g, rp.dim.depth?.toString())
        .replace(/{r}/g, rp.dim.radius?.toString())
        .replace(/{date}/g, new Date().toLocaleDateString().replace(/\//g, '_'));
    return tmp + '.' + ['svg', 'jpg', 'png'][rp.fileType];
}

ipcMain.on('export-img', async (e, data) => {
    let { renderParams, svg } = data;
    renderParams.fileName = parseFileName(renderParams.fileName, renderParams);
    console.log(renderParams);

    let filters = [{ name: 'All Files', extensions: ['*.*'] }];
    switch(renderParams.fileType) {
        case 0:
            filters.unshift({ name: 'Scalable Vector Graphics', extensions: ['*.svg', '*.xml'] });
            break;
        case 1:
            filters.unshift({ name: 'JPEG', extensions: ['*.jpg'] });
            break;
        case 2:
            filters.unshift({ name: 'Portable Network Grapics', extensions: ['*.png'] });
    }
    let r = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Image As',
        defaultPath: path.join(os.homedir(), 'Documents', renderParams.fileName),
        filters
    });
    if(r.canceled) return;
    let file = r.filePath;
    if(renderParams.fileType == 0) {
        await fs.writeFile(file, svg);
    } else {
        let buf = await render({
            buffer: Buffer.from(svg)
        });
        if(renderParams.fileType == 1) {
            buf.toJpeg().toFile(file);
        }
        await fs.writeFile(file, buf);
    }
});