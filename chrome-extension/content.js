// Content script for Tamil AI extension
console.log('Tamil AI Extension: Content script loaded');

// Detect Tamil text and add correction suggestions
function detectTamilText() {
    const textNodes = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    
    textNodes.forEach(element => {
        element.addEventListener('input', (e) => {
            const text = e.target.value;
            if (containsTamil(text)) {
                showTamilIndicator(e.target);
            } else {
                hideTamilIndicator(e.target);
            }
        });
    });
}

// Check if text contains Tamil characters
function containsTamil(text) {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    return tamilRegex.test(text);
}

// Show Tamil indicator
function showTamilIndicator(element) {
    if (element.dataset.tamilIndicator) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'tamil-ai-indicator';
    indicator.textContent = 'தமிழ்';
    indicator.style.cssText = `
        position: absolute;
        background: #667eea;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.appendChild(indicator);
    element.dataset.tamilIndicator = 'true';
}

// Hide Tamil indicator
function hideTamilIndicator(element) {
    const indicator = element.querySelector('.tamil-ai-indicator');
    if (indicator) {
        indicator.remove();
        element.dataset.tamilIndicator = 'false';
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyText') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.value = request.text;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'No active input element' });
        }
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectTamilText);
} else {
    detectTamilText();
}

// Re-detect when new content is added
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const inputs = node.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
                    inputs.forEach(input => {
                        input.addEventListener('input', (e) => {
                            const text = e.target.value;
                            if (containsTamil(text)) {
                                showTamilIndicator(e.target);
                            } else {
                                hideTamilIndicator(e.target);
                            }
                        });
                    });
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});