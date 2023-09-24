const { ipcRenderer } = require('electron');

const codeInput = document.getElementById('code-input');
const analyzeButton = document.getElementById('analyze-button');
const resultContainer = document.getElementById('result-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

analyzeButton.addEventListener('click', () => {
    const code = codeInput.value;
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';

    ipcRenderer.send('analyze-code', code);
});

ipcRenderer.on('analysis-result', (event, analysisResult) => {
    loadingSpinner.style.display = 'none';
    resultContainer.style.display = 'block';
    errorMessage.style.display = 'none';
    resultContainer.textContent = analysisResult;
});

ipcRenderer.on('analysis-error', (event, error) => {
    loadingSpinner.style.display = 'none';
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'block';
    errorMessage.textContent = `An error occurred: ${error}`;
});
