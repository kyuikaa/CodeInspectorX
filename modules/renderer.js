const { ipcRenderer, clipboard } = require('electron');

const codeInput = document.getElementById('code-input');
const analyzeButton = document.getElementById('analyze-button');
const resultContainer = document.getElementById('result-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const copyButton = document.getElementById('copy-button');
const copySuccessMessage = document.getElementById('copy-success-message');

analyzeButton.addEventListener('click', () => {
    const code = codeInput.value;
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    loadingSpinner.style.display = 'block';

    ipcRenderer.send('analyze-code', code);
});

copyButton.addEventListener('click', () => {
    if (resultContainer.textContent) {
        clipboard.writeText(resultContainer.textContent);
        copySuccessMessage.style.display = 'block';
        setTimeout(() => {
            copySuccessMessage.style.display = 'none';
        }, 2000);
    }
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
