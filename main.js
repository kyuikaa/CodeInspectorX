const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
try {
    const openai = require('openai');
} catch (error) {
    console.error('Error loading OpenAI module:', error);
}


let mainWindow = null;
let settingsWindow;

let apiKey = '';
let analysisResult = '';


let analysisOptions = {
    engine: 'davinci-codex', // Default engine
    maxTokens: 100,          // Default max tokens
};

const engineOptions = [
    { name: 'Davinci Codex', value: 'davinci-codex' }, // Default engine
    { name: 'Curie', value: 'curie' },                 // Another available 
    { name: 'GPT', value: 'gpt' },
    // Add more engines here
];

const maxTokensOptions = [50, 100, 150];

function createMainWindow() {
    const mainWindow = new BrowserWindow({
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

    ipcMain.handle('analyze-code', async (event, code, engine) => {

        mainWindow.webContents.send('analysis-result', analysisResult);
        mainWindow.webContents.send('analysis-options', analysisOptions);
        mainWindow.webContents.send('engine-options', engineOptions);

        const result = {
            issues: [],
            metrics: {}
        };
        event.sender.send('analysis-result', JSON.stringify(result, null, 2));
    });

    function createSettingsWindow() {
        const settingsWindow = new BrowserWindow({
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
        {
            label: 'View',
            submenu: [
                {
                    label: 'Save Analysis',
                    click() {
                        if (analysisResult) {
                            saveAnalysisToFile(analysisResult);
                        } else {
                            dialog.showMessageBox(mainWindow, {
                                type: 'info',
                                message: 'No analysis result to save.',
                            });
                        }
                    },
                },
            ],
        },
    ];

    ipcMain.on('set-analysis-options', (event, options) => {
        analysisOptions = { ...analysisOptions, ...options };
        saveApiKey(apiKey);
    });

    ipcMain.on('save-settings', (event, apiKeyInput) => {
        apiKey = apiKeyInput;
        saveApiKey(apiKey);

        if (settingsWindow) {
            settingsWindow.close();
        }
    });

    ipcMain.on('analyze-code', async (event, code, selectedEngine) => {
        if (!apiKey) {
            dialog.showErrorBox('API Key Missing', 'Please enter your OpenAI API key in settings.');
            return;
        }

        const gpt3 = new openai({
            apiKey,
            engine: selectedEngine,
        });

        try {
            const response = await gpt3.completions.create({
                prompt: code,
                max_tokens: analysisOptions.maxTokens,
            });

            const analysisResult = response.choices[0].text;
            mainWindow.webContents.send('analysis-result', analysisResult);
        } catch (error) {
            dialog.showErrorBox('Error Analyzing Code', 'An error occurred during code analysis.');
            console.error('Error analyzing code:', error);
            mainWindow.webContents.send('analysis-error', error.message);
        }
    });

    function loadApiKey() {
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf-8');
            const settings = JSON.parse(settingsData);
            if (settings.apiKey) {
                apiKey = settings.apiKey;
            }
            if (settings.engine) {
                analysisOptions.engine = settings.engine;
            }
            if (settings.maxTokens) {
                analysisOptions.maxTokens = settings.maxTokens;
            }
        }
    }

    function saveApiKey(apiKey) {
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        const settings = { apiKey, ...analysisOptions };

        fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf-8');
    }

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
};