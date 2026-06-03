import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let nextProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'PharmaNile',
    icon: path.join(__dirname, 'public/favicon.ico'),
    autoHideMenuBar: true,
  });

  // Depending on whether we are in dev or prod, we might load a built version or localhost
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  
  // Basic wait for Next.js server to be active. In production we would bundle differently.
  setTimeout(() => {
    mainWindow.loadURL(startUrl);
  }, 3000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Start the Next.js Custom Server
  if (process.env.NODE_ENV !== 'development') {
     nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'start'], {
        cwd: __dirname,
        detached: false,
     });
  }

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
   if (nextProcess) {
      nextProcess.kill();
   }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
