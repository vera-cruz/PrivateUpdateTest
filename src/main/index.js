import { app, BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)
  autoUpdater.checkForUpdatesAndNotify();

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */



//iffy source
let win;

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});

/*
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  //if (process.env.NODE_ENV === 'production')
  //autoUpdater.checkForUpdates()
  autoUpdater.checkForUpdatesAndNotify()
})
*/

/*
const autoUpdater = require("electron-auto-updater").autoUpdater;

const log = require("electron-log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.logger.transports.file.file = __dirname + 'log.log';

autoUpdater.addListener("update-available", function(event) {
  log.info("update-available");
});
autoUpdater.addListener("update-downloaded", function(
  event,
  releaseNotes,
  releaseName,
  releaseDate,
  updateURL
) {
  let message = app.getName() + ' ' + releaseName;
  if (releaseNotes) {
      const splitNotes = releaseNotes.split(/[^\r]\n/);
      message += '\n\nリリース内容:\n';
      splitNotes.forEach(notes => {
          message += notes + '\n\n';
      });
  }
  dialog.showMessageBox({
      type: 'question',
      buttons: ['再起動', 'あとで'],
      defaultId: 0,
      message: '新しいバージョンをダウンロードしました。再起動しますか？',
      detail: message
  }, response => {
      if (response === 0) {
          setTimeout(() => autoUpdater.quitAndInstall(), 1);
      }
  });
  log.info("update-downloaded" + releaseName);
  autoUpdater.quitAndInstall();
  return true;
});
autoUpdater.addListener("error", function(error) {
  log.info(error);
});
autoUpdater.addListener("checking-for-update", function(event) {
  log.info("checking-for-update");
});
autoUpdater.addListener("update-not-available", function() {
  log.info("update-not-available");
});

autoUpdater.checkForUpdates();
*/