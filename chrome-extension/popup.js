const API_BASE_URL = 'http://localhost:8000';

// DOM elements
const textInput = document.getElementById('textInput');
const textOutput = document.getElementById('textOutput');
const correctBtn = document.getElementById('correctBtn');
const applyBtn = document.getElementById('applyBtn');
const suggestions = document.getElementById('suggestions');
const suggestionsList = document.getElementById('suggestionsList');
const apiStatus = document.getElementById('apiStatus');
const statusIndicator = document.getElementById('statusIndicator');

// State
let currentMode = 'live_grammar';
let correctedText = '';

// Event listeners
textInput.addEventListener('input', handleInput);
correctBtn.addEventListener('click', correctText);
applyBtn.addEventListener('click', applyToPage);
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentMode = e.target.value;
        clearOutput();
    });
});

// Handle input with debouncing
let debounceTimer;
function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (textInput.value.trim()) {
            correctText();
        } else {
            clearOutput();
        }
    }, 500);
}

// Clear output
function clearOutput() {
    textOutput.value = '';
    correctedText = '';
    applyBtn.disabled = true;
    suggestions.style.display = 'none';
}

// Correct text
async function correctText() {
    const text = textInput.value.trim();
    if (!text) return;

    correctBtn.disabled = true;
    correctBtn.textContent = 'Correcting...';
    statusIndicator.style.background = '#ffc107';

    try {
        const response = await fetch(`${API_BASE_URL}/process-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                operation: currentMode
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        correctedText = data.corrected_text;
        textOutput.value = correctedText;
        applyBtn.disabled = false;

        // Show suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
            showSuggestions(data.suggestions);
        } else {
            suggestions.style.display = 'none';
        }

        statusIndicator.style.background = '#28a745';
        apiStatus.textContent = 'API Connected';
        apiStatus.className = 'api-status connected';

    } catch (error) {
        console.error('Error:', error);
        textOutput.value = 'Error: Could not connect to API';
        statusIndicator.style.background = '#dc3545';
        apiStatus.textContent = 'API Error';
        apiStatus.className = 'api-status error';
    } finally {
        correctBtn.disabled = false;
        correctBtn.textContent = 'Correct Text';
    }
}

// Show suggestions
function showSuggestions(suggestionsArray) {
    suggestionsList.innerHTML = '';
    suggestionsArray.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
    });
    suggestions.style.display = 'block';
}

// Apply corrected text to the current page
async function applyToPage() {
    if (!correctedText) return;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: applyTextToPage,
            args: [correctedText]
        });

        // Close popup
        window.close();
    } catch (error) {
        console.error('Error applying text:', error);
        alert('Error applying text to page');
    }
}

// Function to inject into the page
function applyTextToPage(text) {
    // Find the active input/textarea element
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.value = text;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // Fallback: try to find any input/textarea on the page
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        if (inputs.length > 0) {
            inputs[0].value = text;
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}

// Check API health on load
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            apiStatus.textContent = 'API Connected';
            apiStatus.className = 'api-status connected';
            statusIndicator.style.background = '#28a745';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        apiStatus.textContent = 'API Disconnected';
        apiStatus.className = 'api-status error';
        statusIndicator.style.background = '#dc3545';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAPIHealth);