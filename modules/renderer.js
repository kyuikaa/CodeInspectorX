const { ipcRenderer, clipboard } = require('electron');

const codeInput = document.getElementById('code-input');
const analyzeButton = document.getElementById('analyze-button');
const resultContainer = document.getElementById('result-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const copyButton = document.getElementById('copy-button');
const copySuccessMessage = document.getElementById('copy-success-message');
const engineSelect = document.getElementById('engine-select');

ipcRenderer.on('engine-options', (event, engineOptions) => {
  engineSelect.innerHTML = '';
  engineOptions.forEach((engine) => {
    const option = document.createElement('option');
    option.value = engine.value;
    option.textContent = engine.name;
    engineSelect.appendChild(option);
  });
});

analyzeButton.addEventListener('click', () => {
  const code = codeInput.value;
  resultContainer.style.display = 'none';
  errorMessage.style.display = 'none';
  loadingSpinner.style.display = 'block';

  const selectedEngine = engineSelect.value;

  ipcRenderer.send('analyze-code', code, selectedEngine);
});

/**
 * Handler for the 'analysis-result' event sent by the main process.
 * Updates the UI to show the analysis result and hide the loading spinner.
 *
 * @param {Object} event - The IPC event object
 * @param {string} analysisResult - The code analysis result text
 */
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
