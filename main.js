const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const openai = require('openai');

let mainWindow;
let settingsWindow;

let apiKey = '';
let analysisResult = '';

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Send the analysis result to the renderer process
    mainWindow.webContents.send('analysis-result', analysisResult);
}

function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });
}

const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Settings',
                click() {
                    createSettingsWindow();
                },
            },
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                },
            },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Clear Analysis',
                click() {
                    analysisResult = '';
                    mainWindow.webContents.send('analysis-result', analysisResult);
                },
            },
        ],
    },
];

function loadApiKey() {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(settingsData);
        if (settings.apiKey) {
            apiKey = settings.apiKey;
        }
    }
}

function saveApiKey(apiKey) {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const settings = { apiKey };

    fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf-8');
}

ipcMain.on('save-settings', (event, apiKeyInput) => {
    apiKey = apiKeyInput;
    saveApiKey(apiKey);

    if (settingsWindow) {
        settingsWindow.close();
    }
});

ipcMain.on('analyze-code', async (event, code) => {
    if (!apiKey) {
        dialog.showErrorBox('API Key Missing', 'Please enter your OpenAI API key in settings.');
        return;
    }

    const gpt3 = new openai({
        apiKey,
        engine: 'davinci-codex',
    });

    try {
        const response = await gpt3.completions.create({
            prompt: code,
            max_tokens: 100,
        });

        const analysisResult = response.choices[0].text;
        mainWindow.webContents.send('analysis-result', analysisResult);
    } catch (error) {
        dialog.showErrorBox('Error Analyzing Code', 'An error occurred during code analysis.');
        console.error('Error analyzing code:', error);
    }
});

app.on('ready', () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
    loadApiKey();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createMainWindow();
    }
});
