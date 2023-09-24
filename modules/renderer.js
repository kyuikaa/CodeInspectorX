const { ipcRenderer } = require('electron');

const codeInput = document.getElementById('codeInput');
const analyzeButton = document.getElementById('analyzeButton');
const analysisResult = document.getElementById('analysisResult');

analyzeButton.addEventListener('click', () => {
    const code = codeInput.value;
    ipcRenderer.send('analyze-code', code);
});

ipcRenderer.on('analysis-result', (event, result) => {
    analysisResult.textContent = result;
});