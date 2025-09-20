const API_BASE_URL = 'http://localhost:8000';

// DOM elements
const textDisplay = document.getElementById('textDisplay');
const resultText = document.getElementById('resultText');
const copyBtn = document.getElementById('copyBtn');
const applyBtn = document.getElementById('applyBtn');
const suggestions = document.getElementById('suggestions');
const suggestionsList = document.getElementById('suggestionsList');
const apiStatus = document.getElementById('apiStatus');
const statusIndicator = document.getElementById('statusIndicator');
const functionBtns = document.querySelectorAll('.function-btn');

// State
let selectedText = '';
let currentFunction = '';
let processedText = '';

// Event listeners
functionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const functionType = e.target.dataset.function;
        selectFunction(functionType);
        processText(functionType);
    });
});

copyBtn.addEventListener('click', copyResult);
applyBtn.addEventListener('click', applyToPage);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'textSelected') {
        selectedText = request.text;
        textDisplay.textContent = selectedText;
        resultText.textContent = 'Select an AI function to process the text';
        suggestions.style.display = 'none';
        console.log('Text selected in sidepanel:', selectedText);
    }
});

// Select function
function selectFunction(functionType) {
    functionBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.function === functionType) {
            btn.classList.add('active');
        }
    });
    currentFunction = functionType;
}

// Process text
async function processText(functionType) {
    if (!selectedText.trim()) {
        resultText.textContent = 'No text selected. Please select Tamil text on the page.';
        return;
    }

    const operation = getOperationFromFunction(functionType);
    if (!operation) return;

    // Show loading state
    resultText.textContent = 'Processing...';
    statusIndicator.style.background = '#ffc107';

    try {
        const response = await fetch(`${API_BASE_URL}/process-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: selectedText,
                operation: operation
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        processedText = data.corrected_text;
        resultText.textContent = processedText;

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
        resultText.textContent = 'Error: Could not connect to API';
        statusIndicator.style.background = '#dc3545';
        apiStatus.textContent = 'API Error';
        apiStatus.className = 'api-status error';
    }
}

// Get operation from function type
function getOperationFromFunction(functionType) {
    const operations = {
        'grammar': 'live_grammar',
        'spelling': 'live_spelling'
    };
    return operations[functionType];
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

// Copy result
function copyResult() {
    if (!processedText) return;
    
    navigator.clipboard.writeText(processedText).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 2000);
    });
}

// Apply to page
async function applyToPage() {
    if (!processedText) return;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: applyTextToPage,
            args: [processedText]
        });

        resultText.textContent = 'Text applied to page!';
    } catch (error) {
        console.error('Error applying text:', error);
        resultText.textContent = 'Error applying text to page';
    }
}

// Function to inject into the page
function applyTextToPage(text) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.value = text;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
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