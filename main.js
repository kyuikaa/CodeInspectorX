const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const openai = require('openai');

const apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key

let mainWindow;

function createWindow() {
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
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('analyze-code', async (event, code) => {
    const gpt3 = new openai({
        apiKey,
        model: 'YOUR_GPT3_MODEL', // Replace with your preferred GPT-3 model
    });

    try {
        // Make an API call to OpenAI for code analysis
        const response = await gpt3.completions.create({
            engine: 'davinci-codex', // Use the Codex engine for code-related tasks
            prompt: code,
            max_tokens: 100, // Adjust as needed
        });

        // Extract and send the analysis result back to the renderer process
        const analysisResult = response.choices[0].text;
        mainWindow.webContents.send('analysis-result', analysisResult);
    } catch (error) {
        console.error('Error analyzing code:', error);
        event.reply('analysis-result', 'An error occurred during analysis.');
    }
});