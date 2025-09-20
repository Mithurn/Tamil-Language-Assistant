// Tamil AI Extension Content Script
console.log('Tamil AI Extension: Content script loaded');

// Prevent multiple injections
if (window.tamilAIExtensionLoaded) {
    console.log('Tamil AI Extension already loaded, skipping...');
} else {
    window.tamilAIExtensionLoaded = true;

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

    // Show result popup
    function showResultPopup(originalText, correctedText, functionType) {
        // Remove existing popup
        const existingPopup = document.querySelector('.tamil-ai-result-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'tamil-ai-result-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h3>Tamil AI Result</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="popup-content">
                <div class="original-text">
                    <strong>Original:</strong> ${originalText}
                </div>
                <div class="corrected-text">
                    <strong>Corrected:</strong> ${correctedText}
                </div>
                <div class="popup-actions">
                    <button class="apply-btn">Apply</button>
                    <button class="copy-btn">Copy</button>
                </div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            max-width: 400px;
            width: 90%;
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .tamil-ai-result-popup .popup-header {
                background: #667eea;
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 8px 8px 0 0;
            }
            .tamil-ai-result-popup .popup-header h3 {
                margin: 0;
                font-size: 16px;
            }
            .tamil-ai-result-popup .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            }
            .tamil-ai-result-popup .popup-content {
                padding: 16px;
            }
            .tamil-ai-result-popup .original-text,
            .tamil-ai-result-popup .corrected-text {
                margin-bottom: 12px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
            }
            .tamil-ai-result-popup .popup-actions {
                display: flex;
                gap: 8px;
            }
            .tamil-ai-result-popup .apply-btn,
            .tamil-ai-result-popup .copy-btn {
                flex: 1;
                padding: 8px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .tamil-ai-result-popup .copy-btn {
                background: #6c757d;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(popup);

        // Add event listeners
        popup.querySelector('.close-btn').addEventListener('click', () => {
            popup.remove();
        });

        popup.querySelector('.apply-btn').addEventListener('click', () => {
            applyTextToPage(correctedText);
            popup.remove();
        });

        popup.querySelector('.copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(correctedText);
            popup.remove();
        });

        // Close on outside click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
    }

    // Apply text to page
    function applyTextToPage(text) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.value = text;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            if (request.action === 'showResult') {
                showResultPopup(request.originalText, request.correctedText, request.function);
                sendResponse({ success: true });
            } else if (request.action === 'applyText') {
                applyTextToPage(request.text);
                sendResponse({ success: true });
            }
        } catch (error) {
            console.log('Extension context error:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
    });

    // Listen for text selection events
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && containsTamil(selectedText)) {
            console.log('Tamil text selected:', selectedText);
            
            // Send selected text to side panel
            try {
                chrome.runtime.sendMessage({
                    action: 'textSelected',
                    text: selectedText
                }).catch(error => {
                    console.log('Could not send message to background:', error);
                });
            } catch (error) {
                if (error.message && error.message.includes('Extension context invalidated')) {
                    console.log('Extension context invalidated - this is normal during development');
                    // Don't show error to user, just log it
                } else {
                    console.log('Error sending message:', error);
                }
            }
        }
    });

    // Setup Tamil text detection
    function setupTamilDetection() {
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTamilDetection);
    } else {
        setupTamilDetection();
    }

    // Re-detect when new content is added
    if (!window.tamilAIObserver) {
        window.tamilAIObserver = new MutationObserver((mutations) => {
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

        window.tamilAIObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}