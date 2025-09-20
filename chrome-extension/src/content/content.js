// Tamil AI Extension Content Script

// Add this at the very top of your content.js, outside any class or function,
// or as a property of your `TamilTooltipSystem` class if you prefer.
let currentSelectionRange = null; 
let currentlySelectedElement = null; // Also store the element that was selected from

// This new event listener is the key
document.addEventListener('contextmenu', () => {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
        // Save the exact position of the selected text
        currentSelectionRange = selection.getRangeAt(0);
        currentlySelectedElement = selection.anchorNode.parentNode;
    } else {
        // If nothing is selected, clear the variables
        currentSelectionRange = null;
        currentlySelectedElement = null;
    }
});

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

            // Only listen for space key, not all input events
            input.addEventListener('keydown', (e) => {
                if (!this.enabled) return;
                if (e.key === ' ' || e.key === 'Space') {
                    // Wait a bit for the space to be processed
                    setTimeout(() => this.checkLastWord(input), 50);
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

        // Removed handleInput - we only check on space key now

        checkLastWord(element) {
            const text = this.getElementText(element);
            
            // Get cursor position to find the word before the space
            const cursorPos = element.selectionStart || text.length;
            
            // Find the word that was just completed (before the cursor/space)
            const textBeforeCursor = text.substring(0, cursorPos).trim();
            const words = textBeforeCursor.split(/\s+/);
            const lastWord = words[words.length - 1];

            console.log('Checking word after space:', lastWord);

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

            const tooltip = this.createTooltip(originalWord, correctedWord, element);

            // Position tooltip
            this.positionTooltip(tooltip, element, originalWord, fullText);
            
            document.body.appendChild(tooltip);
            this.activeTooltips.set(elementId, tooltip);

            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.removeTooltip(elementId);
            }, 10000);
        }

        createTooltip(originalWord, correctedWord, element) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip-dark';
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

            // Add event listeners with direct implementation
            const applyBtn = tooltip.querySelector('.action-apply');
            const ignoreBtn = tooltip.querySelector('.action-ignore');
            const closeBtn = tooltip.querySelector('.tooltip-close');

            applyBtn.addEventListener('click', () => {
                console.log('Apply button clicked!');
                this.directApplyCorrection(element, originalWord, correctedWord);
                this.removeTooltip(this.getElementId(element));
            });

            ignoreBtn.addEventListener('click', () => {
                console.log('Ignore button clicked');
                this.removeTooltip(this.getElementId(element));
            });

            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                this.removeTooltip(this.getElementId(element));
            });

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
            console.log('Applying correction:', originalWord, '→', correctedWord);
            
            try {
                let currentText, newText;
                
                if (element.contentEditable === 'true') {
                    currentText = element.textContent;
                } else {
                    currentText = element.value;
                }
                
                // Simple replacement of the last occurrence
                const lastIndex = currentText.lastIndexOf(originalWord);
                if (lastIndex !== -1) {
                    newText = currentText.substring(0, lastIndex) + correctedWord + currentText.substring(lastIndex + originalWord.length);
                    
                    if (element.contentEditable === 'true') {
                        element.textContent = newText;
                    } else {
                        element.value = newText;
                        // Set cursor after the corrected word
                        const newCursorPos = lastIndex + correctedWord.length;
                        element.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    // Trigger events
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Focus and show feedback
                    element.focus();
                    this.showCorrectionFeedback(element, correctedWord);
                    
                    console.log('Correction applied successfully');
                } else {
                    console.log('Word not found for replacement:', originalWord);
                }
            } catch (error) {
                console.error('Error applying correction:', error);
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

        // Direct, simple apply correction that definitely works
        directApplyCorrection(element, originalWord, correctedWord) {
            console.log('🔧 Direct apply correction called');
            console.log('Element:', element);
            console.log('Original:', originalWord);
            console.log('Corrected:', correctedWord);
            
            try {
                let currentText;
                
                // Get current text
                if (element.contentEditable === 'true') {
                    currentText = element.textContent || element.innerText || '';
                } else {
                    currentText = element.value || '';
                }
                
                console.log('Current text:', currentText);
                
                // Find and replace the word
                const wordIndex = currentText.lastIndexOf(originalWord);
                console.log('Word found at index:', wordIndex);
                
                if (wordIndex !== -1) {
                    // Replace the word
                    const newText = currentText.substring(0, wordIndex) + 
                                   correctedWord + 
                                   currentText.substring(wordIndex + originalWord.length);
                    
                    console.log('New text:', newText);
                    
                    // Apply the new text
                    if (element.contentEditable === 'true') {
                        element.textContent = newText;
                    } else {
                        element.value = newText;
                    }
                    
                    // Show success feedback
                    this.showSuccessMessage('✅ Applied: ' + correctedWord);
                    console.log('✅ Correction applied successfully!');
                    
                    // Focus back to element
                    setTimeout(() => element.focus(), 100);
                    
                } else {
                    console.error('❌ Original word not found in text');
                    this.showSuccessMessage('❌ Word not found');
                }
                
            } catch (error) {
                console.error('❌ Error in directApplyCorrection:', error);
                this.showSuccessMessage('❌ Error applying correction');
            }
        }

        // Simple success message
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

        // Replace the last occurrence of a word (more accurate for real-time corrections)
        replaceLastOccurrence(text, searchWord, replaceWord) {
            const lastIndex = text.lastIndexOf(searchWord);
            if (lastIndex === -1) {
                return text;
            }
            
            // Check if it's a whole word (not part of another word)
            const before = lastIndex > 0 ? text[lastIndex - 1] : ' ';
            const after = lastIndex + searchWord.length < text.length ? text[lastIndex + searchWord.length] : ' ';
            
            // Tamil word boundary check (space, punctuation, or start/end of text)
            const isWordBoundary = /[\s\p{P}]|^|$/u.test(before) && /[\s\p{P}]|^|$/u.test(after);
            
            if (isWordBoundary) {
                return text.substring(0, lastIndex) + replaceWord + text.substring(lastIndex + searchWord.length);
            }
            
            return text;
        }

        // Set cursor position after the corrected word in contenteditable elements
        setCursorAfterWord(element, word) {
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                
                // Find the text node containing the word
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    const index = node.textContent.indexOf(word);
                    if (index !== -1) {
                        range.setStart(node, index + word.length);
                        range.setEnd(node, index + word.length);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        break;
                    }
                }
            } catch (error) {
                console.log('Could not set cursor position:', error);
            }
        }

        // Show visual feedback when correction is applied
        showCorrectionFeedback(element, correctedWord) {
            const feedback = document.createElement('div');
            feedback.className = 'tamil-correction-feedback';
            feedback.textContent = `✓ Applied: ${correctedWord}`;
            
            const rect = element.getBoundingClientRect();
            feedback.style.cssText = `
                position: fixed;
                top: ${rect.bottom + 5}px;
                left: ${rect.left}px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 999999;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                animation: correctionFeedback 2s ease-out forwards;
                pointer-events: none;
            `;
            
            // Add animation styles if not already present
            if (!document.getElementById('correction-feedback-styles')) {
                const style = document.createElement('style');
                style.id = 'correction-feedback-styles';
                style.textContent = `
                    @keyframes correctionFeedback {
                        0% {
                            opacity: 0;
                            transform: translateY(-10px) scale(0.8);
                        }
                        20% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        80% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        100% {
                            opacity: 0;
                            transform: translateY(-10px) scale(0.8);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(feedback);
            
            // Remove feedback after animation
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 2000);
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
            const existingStyle = document.getElementById('tamil-ai-tooltip-dark-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            const style = document.createElement('style');
            style.id = 'tamil-ai-tooltip-dark-styles';
            style.textContent = `
                .tamil-ai-tooltip-dark {
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
                
                .tamil-ai-tooltip-dark .tooltip-header {
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
                
                .tamil-ai-tooltip-dark .tooltip-close {
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
                
                .tamil-ai-tooltip-dark .tooltip-close:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: white;
                    transform: scale(1.1);
                }
                
                .tamil-ai-tooltip-dark .tooltip-body {
                    padding: 16px;
                    background: #1a1a1a;
                    border-radius: 0 0 12px 12px;
                }
                
                .tamil-ai-tooltip-dark .word-comparison {
                    margin-bottom: 16px;
                }
                
                .tamil-ai-tooltip-dark .original-word,
                .tamil-ai-tooltip-dark .corrected-word {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid;
                }
                
                .tamil-ai-tooltip-dark .original-word {
                    background-color: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #fca5a5;
                }
                
                .tamil-ai-tooltip-dark .corrected-word {
                    background-color: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #6ee7b7;
                }
                
                .tamil-ai-tooltip-dark .label {
                    font-weight: 600;
                    margin-right: 10px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    opacity: 0.8;
                }
                
                .tamil-ai-tooltip-dark .word {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-weight: 600;
                    font-size: 15px;
                }
                
                .tamil-ai-tooltip-dark .tooltip-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .tamil-ai-tooltip-dark .action-apply,
                .tamil-ai-tooltip-dark .action-ignore {
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
                
                .tamil-ai-tooltip-dark .action-apply {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                }
                
                .tamil-ai-tooltip-dark .action-apply:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }
                
                .tamil-ai-tooltip-dark .action-ignore {
                    background-color: rgba(107, 114, 128, 0.2);
                    color: #d1d5db;
                    border: 1px solid rgba(107, 114, 128, 0.3);
                }
                
                .tamil-ai-tooltip-dark .action-ignore:hover {
                    background-color: rgba(107, 114, 128, 0.3);
                    transform: translateY(-2px);
                    color: white;
                }
            `;
            
            document.head.appendChild(style);
        }
    }

    // Cleanup any old tooltips to prevent duplicates
    function cleanupOldTooltips() {
        document.querySelectorAll('.tamil-ai-tooltip, [class*="tooltip"]:not(.tamil-ai-tooltip-dark)').forEach(el => {
            if (el.innerHTML && el.innerHTML.includes('Tamil AI Suggestion')) {
                el.remove();
            }
        });
    }
    
    // Run cleanup every 2 seconds to remove any duplicate tooltips
    setInterval(cleanupOldTooltips, 2000);

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
            console.log('Apply button clicked!');
            console.log('Original:', originalText);
            console.log('Corrected:', correctedText);
            
            // Use our improved function for replacing text
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

    // Apply correction for context menu (replaces selected text)
    function applyContextCorrection(originalText, correctedText) {
        console.log('🔧 applyContextCorrection called');
        
        try {
            // Method 1: Best approach - Using document.execCommand for contenteditable fields
            // This handles Gmail & Google Docs best
            const gmailComposeArea = document.querySelector('[contenteditable="true"][aria-label*="Message"]') ||
                                  document.querySelector('[contenteditable="true"][role="textbox"]') ||
                                  document.querySelector('[role="textbox"]') ||
                                  document.querySelector('[contenteditable="true"]');
            
            if (gmailComposeArea) {
                console.log('✨ Found editable area that may be Gmail compose');
                
                // Focus the element first to ensure selection works
                gmailComposeArea.focus();
                
                // Try execCommand if we have selection
                const selection = window.getSelection();
                
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const selectedText = selection.toString();
                    
                    console.log('Selected text:', selectedText);
                    console.log('Original text we want to replace:', originalText);
                    
                    // If we have a valid selection or the content contains our text
                    if (selectedText.includes(originalText) || gmailComposeArea.textContent.includes(originalText)) {
                        // For Gmail, we need to preserve selection
                        // First try execCommand which works better with contenteditable
                        try {
                            // Delete the current selection
                            document.execCommand('delete');
                            // Insert the corrected text
                            document.execCommand('insertText', false, selectedText.replace(originalText, correctedText));
                            
                            console.log('✅ Text replaced via execCommand');
                            tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                            return;
                        } catch (execError) {
                            console.log('execCommand failed, falling back to direct DOM manipulation', execError);
                            
                            // Fallback to direct manipulation if execCommand fails
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                const textNode = document.createTextNode(selectedText.replace(originalText, correctedText));
                                range.insertNode(textNode);
                                
                                // Move selection after the inserted text
                                range.setStartAfter(textNode);
                                range.setEndAfter(textNode);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                
                                // Fire input events
                                gmailComposeArea.dispatchEvent(new Event('input', { bubbles: true }));
                                gmailComposeArea.dispatchEvent(new Event('change', { bubbles: true }));
                                
                                console.log('✅ Text replaced via direct range manipulation');
                                tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                                return;
                            }
                        }
                    }
                }
                
                // If we don't have a selection but we're in a compose area, try to find the text
                if (gmailComposeArea.textContent.includes(originalText)) {
                    // Create a new range to search through the compose area
                    const treeWalker = document.createTreeWalker(
                        gmailComposeArea,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    // Walk through text nodes to find our original text
                    let currentNode;
                    while ((currentNode = treeWalker.nextNode())) {
                        const nodeText = currentNode.nodeValue;
                        const index = nodeText.indexOf(originalText);
                        
                        if (index !== -1) {
                            // Create a range for this text node containing the original text
                            const range = document.createRange();
                            range.setStart(currentNode, index);
                            range.setEnd(currentNode, index + originalText.length);
                            
                            // Select this range
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            // Try execCommand approach first
                            try {
                                document.execCommand('insertText', false, correctedText);
                                console.log('✅ Text found and replaced via search');
                                tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                                return;
                            } catch (execError) {
                                console.log('execCommand failed during search, using node replacement');
                                
                                // Replace text directly in the node as a fallback
                                currentNode.nodeValue = nodeText.substring(0, index) + 
                                                     correctedText + 
                                                     nodeText.substring(index + originalText.length);
                                
                                // Fire input events
                                gmailComposeArea.dispatchEvent(new Event('input', { bubbles: true }));
                                gmailComposeArea.dispatchEvent(new Event('change', { bubbles: true }));
                                
                                console.log('✅ Text found and replaced via node manipulation');
                                tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                                return;
                            }
                        }
                    }
                }
            }
            
            // Method 2: Standard form inputs (input/textarea)
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                const currentText = activeElement.value;
                if (currentText && currentText.includes(originalText)) {
                    // For regular inputs, we can directly modify value
                    const newText = currentText.replace(originalText, correctedText);
                    activeElement.value = newText;
                    
                    // Fire input events
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log('✅ Text replaced in form input');
                    tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                    return;
                }
            }
            
            // Method 3: Fallback - search all text inputs on page
            const textInputs = document.querySelectorAll('input[type="text"], textarea');
            for (let element of textInputs) {
                if (element.value && element.value.includes(originalText)) {
                    element.value = element.value.replace(originalText, correctedText);
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    console.log('✅ Text replaced in found input element');
                    tamilTooltipSystem.showSuccessMessage('✅ Applied: ' + correctedText);
                    return;
                }
            }
            
            // Method 4: Clipboard fallback for when all else fails
            navigator.clipboard.writeText(correctedText).then(() => {
                console.log('Text copied to clipboard as last fallback');
                tamilTooltipSystem.showSuccessMessage('✅ Copied to clipboard: ' + correctedText + '\n\nPaste with Cmd/Ctrl+V');
            }).catch(clipErr => {
                console.error('Even clipboard fallback failed:', clipErr);
                tamilTooltipSystem.showSuccessMessage('❌ Could not apply correction');
            });
            
        } catch (error) {
            console.error('❌ Error applying context correction:', error);
            tamilTooltipSystem.showSuccessMessage('❌ Error applying correction');
        }
    }
    
    // Apply text to page (simplified version for other uses)
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