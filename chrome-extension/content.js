// Tamil AI Extension Content Script
console.log('Tamil AI Extension: Content script loaded');

// Prevent multiple injections
if (window.tamilAIExtensionLoaded) {
    console.log('Tamil AI Extension already loaded, skipping...');
} else {
    window.tamilAIExtensionLoaded = true;

    // TamilTooltipSystem class for real-time corrections
    class TamilTooltipSystem {
        constructor() {
            this.enabled = true;
            this.debounceDelay = 500;
            this.apiEndpoint = 'http://localhost:8000/process-text';
            this.activeTooltips = new Map();
            this.debounceTimers = new Map();
            this.init();
        }

        init() {
            this.loadSettings();
            this.setupEventListeners();
            this.injectStyles();
            console.log('Tamil AI Tooltip System initialized');
        }

        async loadSettings() {
            try {
                const result = await chrome.storage.sync.get(['tooltipsEnabled']);
                this.enabled = result.tooltipsEnabled !== false; // Default to true
            } catch (error) {
                console.log('Could not load settings:', error);
                this.enabled = true;
            }
        }

        async saveSettings() {
            try {
                await chrome.storage.sync.set({ tooltipsEnabled: this.enabled });
            } catch (error) {
                console.log('Could not save settings:', error);
            }
        }

        setupEventListeners() {
            // Listen for input events on text fields
            document.addEventListener('input', (e) => {
                if (!this.enabled) return;
                
                const target = e.target;
                if (this.isTextInput(target)) {
                    this.handleInput(target, e);
                }
            }, true);

            // Listen for new elements being added to DOM
            const observer = new MutationObserver((mutations) => {
                if (!this.enabled) return;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const inputs = node.querySelectorAll('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');
                                inputs.forEach(input => this.setupInputListener(input));
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Setup existing inputs
            document.querySelectorAll('input[type="text"], input[type="email"], textarea, [contenteditable="true"]')
                .forEach(input => this.setupInputListener(input));
        }

        setupInputListener(input) {
            if (input.dataset.tamilAiListener) return;
            input.dataset.tamilAiListener = 'true';

            input.addEventListener('input', (e) => {
                if (!this.enabled) return;
                this.handleInput(input, e);
            });

            input.addEventListener('keydown', (e) => {
                if (!this.enabled) return;
                if (e.key === 'Space' || e.key === ' ') {
                    setTimeout(() => this.checkLastWord(input), 10);
                }
            });
        }

        isTextInput(element) {
            const tagName = element.tagName.toLowerCase();
            return (
                (tagName === 'input' && ['text', 'email', 'search'].includes(element.type)) ||
                tagName === 'textarea' ||
                element.contentEditable === 'true'
            );
        }

        handleInput(element, event) {
            const elementId = this.getElementId(element);
            
            // Clear existing timer
            if (this.debounceTimers.has(elementId)) {
                clearTimeout(this.debounceTimers.get(elementId));
            }

            // Set new timer
            const timer = setTimeout(() => {
                this.checkLastWord(element);
                this.debounceTimers.delete(elementId);
            }, this.debounceDelay);

            this.debounceTimers.set(elementId, timer);
        }

        checkLastWord(element) {
            const text = this.getElementText(element);
            const words = text.split(/\s+/);
            const lastWord = words[words.length - 1];

            if (lastWord && this.containsTamil(lastWord) && lastWord.length > 1) {
                this.processWord(element, lastWord, text);
            }
        }

        async processWord(element, word, fullText) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: word,
                        operation: 'live_grammar'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.corrected_text && data.corrected_text !== word) {
                    this.showTooltip(element, word, data.corrected_text, fullText);
                }
            } catch (error) {
                console.error('Error processing word:', error);
            }
        }

        showTooltip(element, originalWord, correctedWord, fullText) {
            // Remove existing tooltip for this element
            const elementId = this.getElementId(element);
            this.removeTooltip(elementId);

            const tooltip = this.createTooltip(originalWord, correctedWord, () => {
                this.applyCorrection(element, originalWord, correctedWord, fullText);
                this.removeTooltip(elementId);
            }, () => {
                this.removeTooltip(elementId);
            });

            // Position tooltip
            this.positionTooltip(tooltip, element, originalWord, fullText);
            
            document.body.appendChild(tooltip);
            this.activeTooltips.set(elementId, tooltip);

            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.removeTooltip(elementId);
            }, 10000);
        }

        createTooltip(originalWord, correctedWord, onApply, onIgnore) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <span class="tooltip-title">Tamil AI Suggestion</span>
                    <button class="tooltip-close" aria-label="Close">&times;</button>
                </div>
                <div class="tooltip-body">
                    <div class="word-comparison">
                        <div class="original-word">
                            <span class="label">Original:</span>
                            <span class="word">${originalWord}</span>
                        </div>
                        <div class="corrected-word">
                            <span class="label">Suggestion:</span>
                            <span class="word">${correctedWord}</span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="action-apply">Apply</button>
                        <button class="action-ignore">Ignore</button>
                    </div>
                </div>
            `;

            // Add event listeners
            tooltip.querySelector('.action-apply').addEventListener('click', onApply);
            tooltip.querySelector('.action-ignore').addEventListener('click', onIgnore);
            tooltip.querySelector('.tooltip-close').addEventListener('click', onIgnore);

            return tooltip;
        }

        positionTooltip(tooltip, element, word, fullText) {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            // Position tooltip UNDER the input field
            let top = rect.bottom + scrollTop + 8; // 8px gap below the input
            let left = rect.left + scrollLeft;

            // Try to align with the word position if possible
            const wordPosition = this.getWordPosition(element, word, fullText);
            if (wordPosition && wordPosition.x > 0) {
                left = Math.max(rect.left + scrollLeft + wordPosition.x - 50, rect.left + scrollLeft);
            }

            // Adjust if tooltip would go off screen
            const tooltipWidth = 320; // Estimated tooltip width
            if (left + tooltipWidth > window.innerWidth) {
                left = window.innerWidth - tooltipWidth - 10;
            }
            if (left < 10) {
                left = 10;
            }

            // If tooltip would go below viewport, show it above the input instead
            if (top + 120 > window.innerHeight + scrollTop) {
                top = rect.top + scrollTop - 130; // Show above input
            }

            tooltip.style.position = 'absolute';
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.style.zIndex = '999999';
        }

        getWordPosition(element, word, fullText) {
            // This is a simplified version - in practice, you might need more sophisticated word positioning
            const words = fullText.split(/\s+/);
            const wordIndex = words.findIndex(w => w === word);
            
            if (wordIndex >= 0) {
                // Approximate position based on word index
                const averageCharWidth = 8; // Approximate character width
                const wordsBeforeLength = words.slice(0, wordIndex).join(' ').length;
                return { x: wordsBeforeLength * averageCharWidth, y: 0 };
            }
            
            return null;
        }

        applyCorrection(element, originalWord, correctedWord, fullText) {
            const newText = fullText.replace(new RegExp('\\b' + this.escapeRegExp(originalWord) + '\\b', 'g'), correctedWord);
            
            if (element.contentEditable === 'true') {
                element.textContent = newText;
            } else {
                element.value = newText;
            }

            // Trigger input event
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        removeTooltip(elementId) {
            if (this.activeTooltips.has(elementId)) {
                const tooltip = this.activeTooltips.get(elementId);
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                this.activeTooltips.delete(elementId);
            }
        }

        getElementId(element) {
            if (!element.dataset.tamilAiId) {
                element.dataset.tamilAiId = 'tamil-ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }
            return element.dataset.tamilAiId;
        }

        getElementText(element) {
            return element.contentEditable === 'true' ? element.textContent : element.value;
        }

        containsTamil(text) {
            const tamilRegex = /[\u0B80-\u0BFF]/;
            return tamilRegex.test(text);
        }

        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        setEnabled(enabled) {
            this.enabled = enabled;
            this.saveSettings();
            
            if (!enabled) {
                // Clear all active tooltips
                this.activeTooltips.forEach((tooltip, id) => {
                    this.removeTooltip(id);
                });
            }
        }

        injectStyles() {
            if (document.getElementById('tamil-ai-tooltip-styles')) return;

            const style = document.createElement('style');
            style.id = 'tamil-ai-tooltip-styles';
            style.textContent = `
                .tamil-ai-tooltip {
                    position: absolute;
                    background: #1a1a1a;
                    border: 1px solid #2d3748;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    max-width: 320px;
                    min-width: 280px;
                    z-index: 999999;
                    animation: tamilTooltipSlideUp 0.3s ease-out;
                    backdrop-filter: blur(10px);
                }
                
                @keyframes tamilTooltipSlideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                
                .tamil-ai-tooltip .tooltip-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                }
                
                .tamil-ai-tooltip .tooltip-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .tamil-ai-tooltip .tooltip-close:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: white;
                    transform: scale(1.1);
                }
                
                .tamil-ai-tooltip .tooltip-body {
                    padding: 16px;
                    background: #1a1a1a;
                    border-radius: 0 0 12px 12px;
                }
                
                .tamil-ai-tooltip .word-comparison {
                    margin-bottom: 16px;
                }
                
                .tamil-ai-tooltip .original-word,
                .tamil-ai-tooltip .corrected-word {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid;
                }
                
                .tamil-ai-tooltip .original-word {
                    background-color: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                }
                
                .tamil-ai-tooltip .corrected-word {
                    background-color: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #6ee7b7;
                }
                
                .tamil-ai-tooltip .label {
                    font-weight: 600;
                    margin-right: 10px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    opacity: 0.8;
                }
                
                .tamil-ai-tooltip .word {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-weight: 600;
                    font-size: 15px;
                }
                
                .tamil-ai-tooltip .tooltip-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .tamil-ai-tooltip .action-apply,
                .tamil-ai-tooltip .action-ignore {
                    flex: 1;
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                
                .tamil-ai-tooltip .action-apply {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }
                
                .tamil-ai-tooltip .action-apply:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }
                
                .tamil-ai-tooltip .action-ignore {
                    background-color: rgba(107, 114, 128, 0.2);
                    color: #d1d5db;
                    border: 1px solid rgba(107, 114, 128, 0.3);
                }
                
                .tamil-ai-tooltip .action-ignore:hover {
                    background-color: rgba(107, 114, 128, 0.3);
                    transform: translateY(-2px);
                    color: white;
                }
            `;
            
            document.head.appendChild(style);
        }
    }

    // Initialize Tamil Tooltip System
    const tamilTooltipSystem = new TamilTooltipSystem();

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
        if (request.action === 'showResult') {
            showResultPopup(request.originalText, request.correctedText, request.function);
            sendResponse({ success: true });
        } else if (request.action === 'applyText') {
            applyTextToPage(request.text);
            sendResponse({ success: true });
        } else if (request.action === 'toggleTooltips') {
            tamilTooltipSystem.setEnabled(request.enabled);
            sendResponse({ success: true, enabled: tamilTooltipSystem.enabled });
        } else if (request.action === 'getTooltipStatus') {
            sendResponse({ success: true, enabled: tamilTooltipSystem.enabled });
        }
    });

    // Listen for text selection events
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && containsTamil(selectedText)) {
            console.log('Tamil text selected:', selectedText);
            
            // Send selected text to side panel
            chrome.runtime.sendMessage({
                action: 'textSelected',
                text: selectedText
            }).catch(error => {
                console.log('Could not send message to background:', error);
            });
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