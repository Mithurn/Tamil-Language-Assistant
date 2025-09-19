const API_BASE_URL = 'http://localhost:8000';

// DOM elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const operationSelect = document.getElementById('operation');
const processBtn = document.getElementById('processBtn');
const statusDiv = document.getElementById('status');
const suggestionsDiv = document.getElementById('suggestions');
const suggestionsList = document.getElementById('suggestionsList');
const liveModeToggle = document.getElementById('liveMode');
const liveIndicator = document.getElementById('liveIndicator');

// Live correction settings
let debounceTimer;
let isLiveMode = true;
const DEBOUNCE_DELAY = 1000; // 1 second delay

// Event listeners
processBtn.addEventListener('click', processText);
inputText.addEventListener('input', handleLiveInput);
liveModeToggle.addEventListener('change', toggleLiveMode);

// Live input handler with debouncing
function handleLiveInput() {
    if (!isLiveMode) return;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (inputText.value.trim()) {
            processText(true); // true indicates live mode
        } else {
            clearOutput();
        }
    }, DEBOUNCE_DELAY);
}

// Toggle live mode
function toggleLiveMode() {
    isLiveMode = liveModeToggle.checked;
    liveIndicator.style.display = isLiveMode ? 'block' : 'none';
    
    if (!isLiveMode) {
        clearTimeout(debounceTimer);
        clearOutput();
    }
}

// Clear output when input changes
function clearOutput() {
    outputText.value = '';
    hideSuggestions();
    clearStatus();
}

// Show status message
function showStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}

// Clear status
function clearStatus() {
    statusDiv.style.display = 'none';
}

// Show suggestions
function showSuggestions(suggestions) {
    if (suggestions && suggestions.length > 0) {
        suggestionsList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
        suggestionsDiv.classList.remove('hidden');
    } else {
        hideSuggestions();
    }
}

// Hide suggestions
function hideSuggestions() {
    suggestionsDiv.classList.add('hidden');
}

// Process text (live or manual)
async function processText(isLive = false) {
    const text = inputText.value.trim();
    
    if (!text) {
        if (!isLive) showStatus('Please enter some text to process', 'error');
        return;
    }
    
    const operation = operationSelect.value;
    
    // For live mode, only use live operations
    if (isLive && !operation.startsWith('live_')) {
        return;
    }
    
    // Disable button and show loading (only for manual mode)
    if (!isLive) {
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';
    }
    
    showStatus(isLive ? 'Live correcting...' : 'Processing your text...', 'loading');
    
    try {
        const response = await fetch(`${API_BASE_URL}/process-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                operation: operation
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update output
        outputText.value = data.corrected_text;
        
        // Show suggestions if available
        if (data.suggestions) {
            showSuggestions(data.suggestions);
        } else {
            hideSuggestions();
        }
        
        // Show success status
        showStatus(isLive ? 'Live correction applied!' : 'Text processed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        if (!isLive) {
            showStatus(`Error: ${error.message}`, 'error');
            outputText.value = '';
        }
    } finally {
        // Re-enable button (only for manual mode)
        if (!isLive) {
            processBtn.disabled = false;
            processBtn.textContent = 'Manual Check';
        }
    }
}

// Check API health on load
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('API is healthy');
        } else {
            showStatus('API is not responding. Please check if the backend is running.', 'error');
        }
    } catch (error) {
        showStatus('Cannot connect to API. Please start the backend server.', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAPIHealth);