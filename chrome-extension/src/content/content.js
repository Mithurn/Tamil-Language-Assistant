// Tamil AI Extension Content Script - Optimized Spell Check
console.log('Tamil AI Extension: Content script loaded');

// Prevent multiple injections
if (window.tamilAIExtensionLoaded) {
    console.log('Tamil AI Extension already loaded, skipping...');
} else {
    window.tamilAIExtensionLoaded = true;

    // Tamil Spell Check System
    class TamilSpellCheckSystem {
        constructor() {
            this.enabled = true;
            this.apiEndpoint = 'http://localhost:8000/process-text';
            this.activeTooltips = new Map();
            this.checkedWords = new Map(); // Cache for checked words
            this.wordElements = new Map(); // Track word positions for hover
            this.init();
        }

        init() {
            this.loadSettings();
            this.setupEventListeners();
            this.injectStyles();
            console.log('Tamil Spell Check System initialized');
        }

        async loadSettings() {
            try {
                const result = await chrome.storage.sync.get(['spellCheckEnabled']);
                this.enabled = result.spellCheckEnabled !== false; // Default to true
            } catch (error) {
                console.log('Could not load settings:', error);
                this.enabled = true;
            }
        }

        async saveSettings() {
            try {
                await chrome.storage.sync.set({ spellCheckEnabled: this.enabled });
            } catch (error) {
                console.log('Could not save settings:', error);
            }
        }

        setupEventListeners() {
            // Listen for new elements being added to DOM
            const observer = new MutationObserver((mutations) => {
                if (!this.enabled) return;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const inputs = node.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]');
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
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]')
                .forEach(input => this.setupInputListener(input));
        }

        setupInputListener(input) {
            if (input.dataset.tamilSpellCheckListener) return;
            input.dataset.tamilSpellCheckListener = 'true';

            // Listen for keydown events to detect word completion
            input.addEventListener('keydown', (e) => {
                if (!this.enabled) return;
                
                // Check for word completion triggers
                if (this.isWordCompletionTrigger(e.key)) {
                    // Small delay to let the character be added
                    setTimeout(() => this.checkLastWord(input), 50);
                }
            });

            // Listen for paste events
            input.addEventListener('paste', (e) => {
                if (!this.enabled) return;
                setTimeout(() => this.checkAllWords(input), 100);
            });
        }

        isWordCompletionTrigger(key) {
            // Word completion triggers: space, punctuation, enter
            return key === ' ' || 
                   key === 'Enter' || 
                   key === 'Tab' ||
                   /[.,!?;:(){}[\]"'`~@#$%^&*+=|\\/<>]/.test(key);
        }

        checkLastWord(element) {
            const text = this.getElementText(element);
            const cursorPos = this.getCursorPosition(element);
            
            // Get the word that was just completed
            const wordInfo = this.getLastWordInfo(text, cursorPos);
            
            if (wordInfo && this.shouldCheckWord(wordInfo.word)) {
                this.processWord(element, wordInfo.word, wordInfo.position);
            }
        }

        checkAllWords(element) {
            const text = this.getElementText(element);
            const words = this.extractWords(text);
            
            words.forEach((wordInfo, index) => {
                if (this.shouldCheckWord(wordInfo.word)) {
                    this.processWord(element, wordInfo.word, wordInfo.position);
                }
            });
        }

        getLastWordInfo(text, cursorPos) {
            // Find the word before the cursor
            const textBeforeCursor = text.substring(0, cursorPos);
            const words = this.extractWords(textBeforeCursor);
            
            if (words.length > 0) {
                return words[words.length - 1];
            }
            return null;
        }

        extractWords(text) {
            const words = [];
            const wordRegex = /[\u0B80-\u0BFF]+/g; // Tamil characters
            let match;
            
            while ((match = wordRegex.exec(text)) !== null) {
                words.push({
                    word: match[0],
                    position: {
                        start: match.index,
                        end: match.index + match[0].length
                    }
                });
            }
            
            return words;
        }

        shouldCheckWord(word) {
            // Only check Tamil words that are at least 2 characters
            return this.containsTamil(word) && 
                   word.length >= 2 && 
                   !this.checkedWords.has(word.toLowerCase());
        }

        async processWord(element, word, position) {
            try {
                // Check if we already have a correction for this word
                const cacheKey = word.toLowerCase();
                if (this.checkedWords.has(cacheKey)) {
                    const correction = this.checkedWords.get(cacheKey);
                    if (correction !== word) {
                        this.showTooltip(element, word, correction, position);
                    }
                    return;
                }

                // Call API for spell check
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: word,
                        operation: 'spell_check'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Cache the result
                this.checkedWords.set(cacheKey, data.corrected_text);
                
                // Show tooltip if there's a correction
                if (data.corrected_text && data.corrected_text !== word) {
                    this.showTooltip(element, word, data.corrected_text, position);
                }
                
            } catch (error) {
                console.error('Error processing word:', error);
            }
        }

        showTooltip(element, originalWord, correctedWord, position) {
            const elementId = this.getElementId(element);
            
            // Remove existing tooltip for this element
            this.removeTooltip(elementId);

            const tooltip = this.createTooltip(originalWord, correctedWord, element, position);
            
            // Position tooltip
            this.positionTooltip(tooltip, element, position);
            
            document.body.appendChild(tooltip);
            this.activeTooltips.set(elementId, tooltip);

            // Store word element mapping for hover functionality
            this.wordElements.set(elementId, {
                element: element,
                word: originalWord,
                correction: correctedWord,
                position: position
            });

            // Auto-hide after 8 seconds
            setTimeout(() => {
                this.removeTooltip(elementId);
            }, 8000);
        }

        createTooltip(originalWord, correctedWord, element, position) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-spell-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="word-suggestion">
                        <span class="suggestion-label">Did you mean:</span>
                        <span class="corrected-word">${correctedWord}</span>
                    </div>
                    <div class="tooltip-actions">
                        <button class="action-apply" title="Apply correction">✓</button>
                        <button class="action-ignore" title="Ignore">✕</button>
                    </div>
                </div>
            `;

            // Add event listeners
            const applyBtn = tooltip.querySelector('.action-apply');
            const ignoreBtn = tooltip.querySelector('.action-ignore');

            applyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyCorrection(element, originalWord, correctedWord, position);
                this.removeTooltip(this.getElementId(element));
            });

            ignoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTooltip(this.getElementId(element));
            });

            // Add hover functionality to reactivate tooltip
            this.addHoverFunctionality(element, originalWord, correctedWord, position);

            return tooltip;
        }

        addHoverFunctionality(element, originalWord, correctedWord, position) {
            // Create invisible overlay for hover detection
            const overlay = document.createElement('div');
            overlay.className = 'tamil-word-overlay';
            overlay.style.cssText = `
                position: absolute;
                background: transparent;
                cursor: pointer;
                z-index: 999998;
                border-radius: 2px;
            `;

            // Position overlay over the word
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Calculate word position (simplified)
            const wordRect = this.calculateWordRect(element, position);
            
            overlay.style.top = `${wordRect.top + scrollTop}px`;
            overlay.style.left = `${wordRect.left + scrollLeft}px`;
            overlay.style.width = `${wordRect.width}px`;
            overlay.style.height = `${wordRect.height}px`;

            // Add hover event
            overlay.addEventListener('mouseenter', () => {
                if (!this.activeTooltips.has(this.getElementId(element))) {
                    this.showTooltip(element, originalWord, correctedWord, position);
                }
            });

            document.body.appendChild(overlay);

            // Store overlay for cleanup
            if (!element.dataset.tamilOverlays) {
                element.dataset.tamilOverlays = '[]';
            }
            const overlays = JSON.parse(element.dataset.tamilOverlays);
            overlays.push(overlay);
            element.dataset.tamilOverlays = JSON.stringify(overlays);
        }

        calculateWordRect(element, position) {
            // Simplified word position calculation
            const rect = element.getBoundingClientRect();
            const text = this.getElementText(element);
            const textBeforeWord = text.substring(0, position.start);
            
            // Approximate character width (this could be more sophisticated)
            const charWidth = 8;
            const charHeight = 16;
            
            return {
                top: rect.top,
                left: rect.left + (textBeforeWord.length * charWidth),
                width: (position.end - position.start) * charWidth,
                height: charHeight
            };
        }

        positionTooltip(tooltip, element, position) {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            // Position tooltip below the input field
            let top = rect.bottom + scrollTop + 8;
            let left = rect.left + scrollLeft;

            // Try to align with the word position
            const wordRect = this.calculateWordRect(element, position);
            if (wordRect) {
                left = Math.max(rect.left + scrollLeft + wordRect.left - rect.left, rect.left + scrollLeft);
            }

            // Adjust if tooltip would go off screen
            const tooltipWidth = 280;
            if (left + tooltipWidth > window.innerWidth) {
                left = window.innerWidth - tooltipWidth - 10;
            }
            if (left < 10) {
                left = 10;
            }

            // If tooltip would go below viewport, show it above
            if (top + 80 > window.innerHeight + scrollTop) {
                top = rect.top + scrollTop - 90;
            }

            tooltip.style.position = 'absolute';
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.style.zIndex = '999999';
        }

        applyCorrection(element, originalWord, correctedWord, position) {
            try {
                const currentText = this.getElementText(element);
                const newText = currentText.substring(0, position.start) + 
                               correctedWord + 
                               currentText.substring(position.end);
                
                if (element.contentEditable === 'true') {
                    element.textContent = newText;
                } else {
                    element.value = newText;
                }
                
                // Trigger events
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show success feedback
                this.showSuccessMessage(`✓ Applied: ${correctedWord}`);
                
                // Focus back to element
                setTimeout(() => element.focus(), 100);
                
            } catch (error) {
                console.error('Error applying correction:', error);
                this.showSuccessMessage('❌ Error applying correction');
            }
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
            if (!element.dataset.tamilSpellCheckId) {
                element.dataset.tamilSpellCheckId = 'tamil-spell-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }
            return element.dataset.tamilSpellCheckId;
        }

        getElementText(element) {
            return element.contentEditable === 'true' ? element.textContent : element.value;
        }

        getCursorPosition(element) {
            if (element.contentEditable === 'true') {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    return range.startOffset;
                }
            } else {
                return element.selectionStart || element.value.length;
            }
            return 0;
        }

        containsTamil(text) {
            const tamilRegex = /[\u0B80-\u0BFF]/;
            return tamilRegex.test(text);
        }

        showSuccessMessage(message) {
            const msg = document.createElement('div');
            msg.textContent = message;
            msg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                animation: slideIn 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            // Add animation if not present
            if (!document.getElementById('success-animation-styles')) {
                const style = document.createElement('style');
                style.id = 'success-animation-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(msg);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (msg.parentNode) {
                    msg.remove();
                }
            }, 3000);
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
            // Remove any existing styles first
            const existingStyle = document.getElementById('tamil-spell-check-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            const style = document.createElement('style');
            style.id = 'tamil-spell-check-styles';
            style.textContent = `
                .tamil-spell-tooltip {
                    position: absolute;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    max-width: 280px;
                    z-index: 999999;
                    animation: tooltipSlideUp 0.2s ease-out;
                }
                
                @keyframes tooltipSlideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(4px) scale(0.98); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                
                .tamil-spell-tooltip .tooltip-content {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                
                .tamil-spell-tooltip .word-suggestion {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .tamil-spell-tooltip .suggestion-label {
                    font-size: 11px;
                    color: #6b7280;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .tamil-spell-tooltip .corrected-word {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-weight: 600;
                    font-size: 15px;
                    color: #059669;
                }
                
                .tamil-spell-tooltip .tooltip-actions {
                    display: flex;
                    gap: 6px;
                }
                
                .tamil-spell-tooltip .action-apply,
                .tamil-spell-tooltip .action-ignore {
                    width: 28px;
                    height: 28px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .tamil-spell-tooltip .action-apply {
                    background: #10b981;
                    color: white;
                }
                
                .tamil-spell-tooltip .action-apply:hover {
                    background: #059669;
                    transform: scale(1.05);
                }
                
                .tamil-spell-tooltip .action-ignore {
                    background: #f3f4f6;
                    color: #6b7280;
                }
                
                .tamil-spell-tooltip .action-ignore:hover {
                    background: #e5e7eb;
                    color: #374151;
                    transform: scale(1.05);
                }
                
                .tamil-word-overlay {
                    position: absolute;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 2px;
                    transition: background 0.2s;
                }
                
                .tamil-word-overlay:hover {
                    background: rgba(16, 185, 129, 0.2);
                }
            `;
            
            document.head.appendChild(style);
        }
    }

    // Initialize Tamil Spell Check System
    const tamilSpellCheckSystem = new TamilSpellCheckSystem();

    // Context menu functionality (keeping existing)
    let currentSelectionRange = null;
    let currentlySelectedElement = null;

    document.addEventListener('contextmenu', () => {
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0) {
            currentSelectionRange = selection.getRangeAt(0);
            currentlySelectedElement = selection.anchorNode.parentNode;
        } else {
            currentSelectionRange = null;
            currentlySelectedElement = null;
        }
    });

    // Show result popup for context menu
    function showResultPopup(originalText, correctedText, functionType) {
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
            applyContextCorrection(originalText, correctedText);
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

    // Apply correction for context menu
    function applyContextCorrection(originalText, correctedText) {
        try {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                const currentText = activeElement.value;
                if (currentText && currentText.includes(originalText)) {
                    const newText = currentText.replace(originalText, correctedText);
                    activeElement.value = newText;
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                    tamilSpellCheckSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                    return;
                }
            }
            
            // Fallback to clipboard
            navigator.clipboard.writeText(correctedText).then(() => {
                tamilSpellCheckSystem.showSuccessMessage('✅ Copied to clipboard: ' + correctedText);
            }).catch(() => {
                tamilSpellCheckSystem.showSuccessMessage('❌ Could not apply correction');
            });
            
        } catch (error) {
            console.error('Error applying context correction:', error);
            tamilSpellCheckSystem.showSuccessMessage('❌ Error applying correction');
        }
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'showResult') {
            showResultPopup(request.originalText, request.correctedText, request.function);
            sendResponse({ success: true });
        } else if (request.action === 'toggleSpellCheck') {
            tamilSpellCheckSystem.setEnabled(request.enabled);
            sendResponse({ success: true, enabled: tamilSpellCheckSystem.enabled });
        } else if (request.action === 'getSpellCheckStatus') {
            sendResponse({ success: true, enabled: tamilSpellCheckSystem.enabled });
        }
    });
}