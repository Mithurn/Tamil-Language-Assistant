// Tamil AI Extension Content Script
console.log('Tamil AI Extension: Content script loaded');

// Prevent multiple injections
if (window.tamilAIExtensionLoaded) {
    console.log('Tamil AI Extension already loaded, skipping...');
} else {
    window.tamilAIExtensionLoaded = true;

    // Tooltip system for real-time Tamil text correction
    class TamilTooltipSystem {
        constructor() {
            this.activeTooltips = new Map();
            this.apiEndpoint = 'http://localhost:8000/process-text';
            this.debounceDelay = 200; // ms - reduced from 500ms
            this.debounceTimers = new Map();
            this.isEnabled = true;
            this.cache = new Map(); // Add caching for faster responses
        }

        // Check if text contains Tamil characters
        containsTamil(text) {
            const tamilRegex = /[\u0B80-\u0BFF]/;
            return tamilRegex.test(text);
        }

        // Extract Tamil words from text
        extractTamilWords(text) {
            const tamilWordRegex = /[\u0B80-\u0BFF]+/g;
            return text.match(tamilWordRegex) || [];
        }

        // Debounced API call for complete words only
        async checkWordWithAPI(word, element, position) {
            // Skip if word is too short or contains only spaces/punctuation
            if (!word || word.length < 2 || /^[\s\p{P}]+$/u.test(word)) {
                return;
            }

            const key = `${element.id || 'default'}-${word}`;
            
            // Check cache first for instant response
            if (this.cache.has(word)) {
                const cachedResult = this.cache.get(word);
                if (cachedResult.corrected_text !== word) {
                    this.showTooltip(element, word, cachedResult.corrected_text, position);
                }
                return;
            }
            
            // Clear existing timer
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }

            // Show processing indicator
            this.showProcessingIndicator(element, position);

            return new Promise((resolve) => {
                const timer = setTimeout(async () => {
                    try {
                        // Use optimized endpoint for single words
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

                        if (response.ok) {
                            const data = await response.json();
                            
                            // Cache the result for future use
                            this.cache.set(word, data);
                            
                            if (data.corrected_text !== word) {
                                this.hideProcessingIndicator(element);
                                this.showTooltip(element, word, data.corrected_text, position);
                            } else {
                                this.hideProcessingIndicator(element);
                            }
                        } else {
                            this.hideProcessingIndicator(element);
                        }
                    } catch (error) {
                        console.log('API call failed:', error);
                        this.hideProcessingIndicator(element);
                    }
                    this.debounceTimers.delete(key);
                }, this.debounceDelay);

                this.debounceTimers.set(key, timer);
            });
        }

        // Show tooltip with correction suggestion
        showTooltip(element, originalWord, correctedWord, position) {
            // Remove existing tooltip for this element
            this.hideTooltip(element);

            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <span class="tooltip-icon">✏️</span>
                        <span class="tooltip-title">Tamil AI Suggestion</span>
                        <button class="tooltip-close">&times;</button>
                    </div>
                    <div class="tooltip-body">
                        <div class="original-word">
                            <span class="label">Original:</span>
                            <span class="word">${originalWord}</span>
                        </div>
                        <div class="corrected-word">
                            <span class="label">Suggested:</span>
                            <span class="word">${correctedWord}</span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="tooltip-apply" data-original="${originalWord}" data-corrected="${correctedWord}">
                            Apply
                        </button>
                        <button class="tooltip-ignore">
                            Ignore
                        </button>
                    </div>
                </div>
            `;

            // Position tooltip
            const rect = element.getBoundingClientRect();
            tooltip.style.cssText = `
                position: absolute;
                top: ${rect.top - 10}px;
                left: ${rect.left + position}px;
                z-index: 10000;
                max-width: 300px;
                pointer-events: auto;
            `;

            // Add tooltip styles
            this.addTooltipStyles();

            document.body.appendChild(tooltip);
            this.activeTooltips.set(element, tooltip);

            // Add event listeners
            this.setupTooltipEvents(tooltip, element, originalWord, correctedWord);
        }

        // Hide tooltip
        hideTooltip(element) {
            const tooltip = this.activeTooltips.get(element);
            if (tooltip) {
                tooltip.remove();
                this.activeTooltips.delete(element);
            }
        }

        // Show processing indicator
        showProcessingIndicator(element, position) {
            this.hideProcessingIndicator(element);
            
            const indicator = document.createElement('div');
            indicator.className = 'tamil-ai-processing';
            indicator.innerHTML = '⏳';
            
            const rect = element.getBoundingClientRect();
            indicator.style.cssText = `
                position: absolute;
                top: ${rect.top - 25}px;
                left: ${rect.left + position}px;
                z-index: 10001;
                background: #667eea;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                animation: pulse 1s infinite;
            `;
            
            // Add pulse animation
            if (!document.getElementById('tamil-ai-processing-styles')) {
                const style = document.createElement('style');
                style.id = 'tamil-ai-processing-styles';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(indicator);
            element.dataset.processingIndicator = 'true';
        }

        // Hide processing indicator
        hideProcessingIndicator(element) {
            const indicator = document.querySelector('.tamil-ai-processing');
            if (indicator) {
                indicator.remove();
            }
            element.dataset.processingIndicator = 'false';
        }

        // Setup tooltip event listeners
        setupTooltipEvents(tooltip, element, originalWord, correctedWord) {
            // Close button
            tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
                this.hideTooltip(element);
            });

            // Apply button
            tooltip.querySelector('.tooltip-apply').addEventListener('click', () => {
                this.applyCorrection(element, originalWord, correctedWord);
                this.hideTooltip(element);
            });

            // Ignore button
            tooltip.querySelector('.tooltip-ignore').addEventListener('click', () => {
                this.hideTooltip(element);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!tooltip.contains(e.target) && !element.contains(e.target)) {
                    this.hideTooltip(element);
                }
            });
        }

        // Apply correction to the element
        applyCorrection(element, originalWord, correctedWord) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                const currentValue = element.value;
                const newValue = currentValue.replace(originalWord, correctedWord);
                element.value = newValue;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Clear highlights after applying correction
                this.clearAllHighlights(element);
                
                // Re-process the text to check for other errors
                setTimeout(() => {
                    this.processAllTamilWords(newValue, element);
                }, 100);
            } else if (element.contentEditable === 'true') {
                // Find and replace the highlighted word
                const highlights = element.querySelectorAll('.tamil-ai-word-highlight');
                highlights.forEach(highlight => {
                    if (highlight.dataset.originalWord === originalWord) {
                        highlight.textContent = correctedWord;
                        highlight.classList.remove('tamil-ai-word-highlight');
                        highlight.classList.add('tamil-ai-corrected-word');
                    }
                });
                
                // Clear other highlights and re-process
                setTimeout(() => {
                    this.clearAllHighlights(element);
                    this.processAllTamilWords(element.textContent, element);
                }, 100);
            }
        }

        // Add tooltip CSS styles
        addTooltipStyles() {
            if (document.getElementById('tamil-ai-tooltip-styles')) return;

            const style = document.createElement('style');
            style.id = 'tamil-ai-tooltip-styles';
            style.textContent = `
                .tamil-ai-tooltip {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 12px;
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    animation: tooltipFadeIn 0.2s ease-out;
                    backdrop-filter: blur(10px);
                }

                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .tamil-ai-tooltip .tooltip-content {
                    padding: 0;
                }

                .tamil-ai-tooltip .tooltip-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .tamil-ai-tooltip .tooltip-icon {
                    font-size: 16px;
                    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
                }

                .tamil-ai-tooltip .tooltip-title {
                    font-weight: 600;
                    flex: 1;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .tamil-ai-tooltip .tooltip-close {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 2px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .tamil-ai-tooltip .tooltip-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }

                .tamil-ai-tooltip .tooltip-body {
                    padding: 12px;
                    background: #0f0f0f;
                }

                .tamil-ai-tooltip .original-word,
                .tamil-ai-tooltip .corrected-word {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: #1a1a1a;
                    border: 1px solid #333;
                }

                .tamil-ai-tooltip .original-word {
                    border-left: 4px solid #ff4444;
                    box-shadow: 0 0 10px rgba(255, 68, 68, 0.1);
                }

                .tamil-ai-tooltip .corrected-word {
                    border-left: 4px solid #00ff88;
                    box-shadow: 0 0 10px rgba(0, 255, 136, 0.1);
                }

                .tamil-ai-tooltip .label {
                    font-weight: 600;
                    margin-right: 8px;
                    min-width: 60px;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #888;
                    letter-spacing: 0.5px;
                }

                .tamil-ai-tooltip .word {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-size: 16px;
                    font-weight: 500;
                    color: #fff;
                }

                .tamil-ai-tooltip .tooltip-actions {
                    padding: 8px 12px;
                    background: #1a1a1a;
                    border-radius: 0 0 12px 12px;
                    display: flex;
                    gap: 8px;
                    border-top: 1px solid #333;
                }

                .tamil-ai-tooltip .tooltip-apply,
                .tamil-ai-tooltip .tooltip-ignore {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .tamil-ai-tooltip .tooltip-apply {
                    background: linear-gradient(135deg, #00ff88 0%, #00aaff 100%);
                    color: #000;
                    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
                }

                .tamil-ai-tooltip .tooltip-apply:hover {
                    box-shadow: 0 0 25px rgba(0, 255, 136, 0.5);
                    transform: translateY(-2px);
                }

                .tamil-ai-tooltip .tooltip-ignore {
                    background: #333;
                    color: #ccc;
                    border: 1px solid #555;
                }

                .tamil-ai-tooltip .tooltip-ignore:hover {
                    background: #444;
                    color: #fff;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);
        }

        // Setup real-time monitoring for input elements
        setupRealTimeMonitoring() {
            const inputElements = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
            
            inputElements.forEach(element => {
                this.attachInputListener(element);
            });
        }

        // Attach input listener to element
        attachInputListener(element) {
            let lastProcessedWords = new Set();
            let currentWord = '';
            let wordStartPosition = 0;

            const handleKeyUp = (e) => {
                if (!this.isEnabled) return;
                
                const text = e.target.value || e.target.textContent || '';
                    const cursorPosition = e.target.selectionStart || 0;
                    
                // When space is pressed, process the word that was just completed
                if (e.key === ' ') {
                    // Get the word that was just completed (before the space)
                    const wordBeforeSpace = this.getWordBeforeCursor(text, cursorPosition - 1);
                    
                    if (wordBeforeSpace && this.containsTamil(wordBeforeSpace)) {
                        // Find the position of this word in the text
                        const wordPosition = this.findWordPosition(text, wordBeforeSpace, cursorPosition - 1);
                        
                        if (wordPosition) {
                            // Process this specific word immediately
                            this.processWordImmediately(element, wordBeforeSpace, wordPosition.start, wordPosition.end);
                        }
                    }
                }
                
                // Also trigger on other word completion characters
                if (e.key === 'Enter' || e.key === '.' || e.key === ',' || 
                    e.key === '!' || e.key === '?' || e.key === ';' || e.key === ':' ||
                    /[\p{P}]/u.test(e.key)) {
                    
                    const wordBeforePunctuation = this.getWordBeforeCursor(text, cursorPosition - 1);
                    
                    if (wordBeforePunctuation && this.containsTamil(wordBeforePunctuation)) {
                        const wordPosition = this.findWordPosition(text, wordBeforePunctuation, cursorPosition - 1);
                        
                        if (wordPosition) {
                            this.processWordImmediately(element, wordBeforePunctuation, wordPosition.start, wordPosition.end);
                        }
                    }
                }
            };

            // Use keyup for immediate word processing
            element.addEventListener('keyup', handleKeyUp);

            // Process on paste
            element.addEventListener('paste', (e) => {
                setTimeout(() => {
                    const text = e.target.value || e.target.textContent || '';
                    if (this.containsTamil(text)) {
                        this.processAllTamilWords(text, element);
                    }
                }, 100);
            });
        }

        // Get the word that was just typed before the cursor
        getWordBeforeCursor(text, cursorPosition) {
            let start = cursorPosition;
            let end = cursorPosition;
            
            // Move start to beginning of word
            while (start > 0 && !/[\s\p{P}]/u.test(text[start - 1])) {
                start--;
            }
            
            // Move end to end of word
            while (end < text.length && !/[\s\p{P}]/u.test(text[end])) {
                end++;
            }
            
            const word = text.substring(start, end).trim();
            return word || null;
        }

        // Find the exact position of a word in the text
        findWordPosition(text, word, searchStart) {
            // Search backwards from the cursor position to find the word
            let start = searchStart;
            
            while (start >= 0) {
                if (text.substring(start, start + word.length) === word) {
                    // Check if this is a complete word (bounded by spaces/punctuation)
                    const beforeChar = start > 0 ? text[start - 1] : ' ';
                    const afterChar = start + word.length < text.length ? text[start + word.length] : ' ';
                    
                    if (/[\s\p{P}]/u.test(beforeChar) && /[\s\p{P}]/u.test(afterChar)) {
                        return {
                            start: start,
                            end: start + word.length
                        };
                    }
                }
                start--;
            }
            
            return null;
        }

        // Process a word immediately when space is pressed
        async processWordImmediately(element, word, start, end) {
            // Skip very short words
            if (word.length < 2) return;
            
            // Check if word needs correction
            const needsCorrection = await this.checkWordNeedsCorrection(word);
            
            if (needsCorrection) {
                // Highlight the word
                this.highlightWord(element, word, start, end);
                
                // Show tooltip directly under the word
                this.showTooltipUnderWord(element, word, needsCorrection, start, end);
            }
        }

        // Process all Tamil words in the text
        async processAllTamilWords(text, element) {
            const tamilWords = this.extractTamilWords(text);
            const wordPositions = this.getWordPositions(text, tamilWords);
            
            // Clear existing highlights
            this.clearAllHighlights(element);
            
            // Process words in context (sentence by sentence)
            const sentences = this.splitIntoSentences(text);
            
            for (const sentence of sentences) {
                if (this.containsTamil(sentence)) {
                    await this.processSentence(sentence, element, text);
                }
            }
        }

        // Split text into sentences
        splitIntoSentences(text) {
            // Split by sentence boundaries (., !, ?, ;, :)
            const sentences = text.split(/[.!?;:]+/).filter(s => s.trim().length > 0);
            return sentences.map(s => s.trim());
        }

        // Process a sentence for Tamil corrections
        async processSentence(sentence, element, fullText) {
            const tamilWords = this.extractTamilWords(sentence);
            
            // If sentence has multiple Tamil words, process with context
            if (tamilWords.length > 1) {
                const sentenceCorrection = await this.checkSentenceWithContext(sentence);
                if (sentenceCorrection && sentenceCorrection !== sentence) {
                    // Show sentence-level correction
                    this.showSentenceCorrection(element, sentence, sentenceCorrection, fullText);
                }
            } else {
                // Process individual words
                for (const word of tamilWords) {
                    const wordPositions = this.getWordPositions(fullText, [word]);
                    for (const wordData of wordPositions) {
                        const { word: wordText, start, end } = wordData;
                        
                        if (wordText.length < 2) continue;
                        
                        const needsCorrection = await this.checkWordNeedsCorrection(wordText);
                        
                        if (needsCorrection) {
                            this.highlightWord(element, wordText, start, end);
                            this.showTooltipForWord(element, wordText, needsCorrection, start, end);
                        }
                    }
                }
            }
        }

        // Check sentence with context for better corrections
        async checkSentenceWithContext(sentence) {
            // Check cache first
            if (this.cache.has(sentence)) {
                const cachedResult = this.cache.get(sentence);
                return cachedResult.corrected_text;
            }
            
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: sentence,
                        operation: 'live_grammar'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.cache.set(sentence, data);
                    return data.corrected_text;
                }
            } catch (error) {
                console.log('API call failed:', error);
            }
            
            return null;
        }

        // Show sentence-level correction
        showSentenceCorrection(element, originalSentence, correctedSentence, fullText) {
            // Find sentence position in full text
            const sentenceStart = fullText.indexOf(originalSentence);
            const sentenceEnd = sentenceStart + originalSentence.length;
            
            // Highlight the entire sentence
            this.highlightSentence(element, originalSentence, sentenceStart, sentenceEnd);
            
            // Show sentence correction tooltip
            this.showSentenceTooltip(element, originalSentence, correctedSentence, sentenceStart, sentenceEnd);
        }

        // Highlight a sentence
        highlightSentence(element, sentence, start, end) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                this.createInputHighlight(element, sentence, start, end);
            } else if (element.contentEditable === 'true') {
                this.highlightContentEditable(element, sentence, start, end);
            }
        }

        // Show sentence correction tooltip
        showSentenceTooltip(element, originalSentence, correctedSentence, start, end) {
            this.hideTooltip(element);

            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip tamil-ai-sentence-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <span class="tooltip-icon">📝</span>
                        <span class="tooltip-title">Tamil AI Sentence Correction</span>
                        <button class="tooltip-close">&times;</button>
                    </div>
                    <div class="tooltip-body">
                        <div class="original-sentence">
                            <span class="label">Original:</span>
                            <span class="sentence">${originalSentence}</span>
                        </div>
                        <div class="corrected-sentence">
                            <span class="label">Suggested:</span>
                            <span class="sentence">${correctedSentence}</span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="tooltip-apply" data-original="${originalSentence}" data-corrected="${correctedSentence}">
                            Apply
                        </button>
                        <button class="tooltip-ignore">
                            Ignore
                        </button>
                    </div>
                </div>
            `;

            // Position tooltip
            this.positionTooltipUnderWord(tooltip, element, start, end);
            this.addTooltipStyles();
            this.addSentenceTooltipStyles();

            document.body.appendChild(tooltip);
            this.activeTooltips.set(element, tooltip);

            // Add event listeners
            this.setupTooltipEvents(tooltip, element, originalSentence, correctedSentence);
        }

        // Add sentence tooltip styles
        addSentenceTooltipStyles() {
            if (document.getElementById('tamil-ai-sentence-tooltip-styles')) return;

            const style = document.createElement('style');
            style.id = 'tamil-ai-sentence-tooltip-styles';
            style.textContent = `
                .tamil-ai-sentence-tooltip {
                    max-width: 500px !important;
                }
                
                .tamil-ai-sentence-tooltip .sentence {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                }
                
                .tamil-ai-sentence-tooltip .original-sentence,
                .tamil-ai-sentence-tooltip .corrected-sentence {
                    margin-bottom: 12px;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                
                .tamil-ai-sentence-tooltip .label {
                    font-weight: 600;
                    margin-right: 8px;
                    min-width: 80px;
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #6c757d;
                }
            `;
            document.head.appendChild(style);
        }

        // Get positions of all Tamil words in text
        getWordPositions(text, tamilWords) {
            const positions = [];
            let searchStart = 0;
            
            for (const word of tamilWords) {
                const index = text.indexOf(word, searchStart);
                if (index !== -1) {
                    positions.push({
                        word: word,
                        start: index,
                        end: index + word.length
                    });
                    searchStart = index + word.length;
                }
            }
            
            return positions;
        }

        // Check if a word needs correction (with caching)
        async checkWordNeedsCorrection(word) {
            // Check cache first
            if (this.cache.has(word)) {
                const cachedResult = this.cache.get(word);
                return cachedResult.corrected_text !== word ? cachedResult.corrected_text : null;
            }
            
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

                if (response.ok) {
                    const data = await response.json();
                    this.cache.set(word, data);
                    return data.corrected_text !== word ? data.corrected_text : null;
                }
            } catch (error) {
                console.log('API call failed:', error);
            }
            
            return null;
        }

        // Highlight a problematic word
        highlightWord(element, word, start, end) {
            // Create highlight element
            const highlight = document.createElement('span');
            highlight.className = 'tamil-ai-word-highlight';
            highlight.dataset.originalWord = word;
            highlight.dataset.start = start;
            highlight.dataset.end = end;
            
            // Add highlight styles
            this.addHighlightStyles();
            
            // For input/textarea, we need to create a visual overlay
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                this.createInputHighlight(element, word, start, end);
            } else if (element.contentEditable === 'true') {
                // For contenteditable, we can directly modify the content
                this.highlightContentEditable(element, word, start, end);
            }
        }

        // Create visual highlight for input/textarea elements
        createInputHighlight(element, word, start, end) {
            const rect = element.getBoundingClientRect();
            const text = element.value;
            
            // Create a temporary element to measure text width
            const tempElement = document.createElement('span');
            tempElement.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: pre;
                font: inherit;
                padding: inherit;
                border: inherit;
                margin: inherit;
                line-height: inherit;
                letter-spacing: inherit;
                word-spacing: inherit;
            `;
            tempElement.textContent = text.substring(0, start);
            document.body.appendChild(tempElement);
            
            const startWidth = tempElement.offsetWidth;
            tempElement.textContent = text.substring(0, end);
            const endWidth = tempElement.offsetWidth;
            
            document.body.removeChild(tempElement);
            
            // Create highlight overlay
            const highlight = document.createElement('div');
            highlight.className = 'tamil-ai-input-highlight';
            highlight.style.cssText = `
                position: absolute;
                top: ${rect.top}px;
                left: ${rect.left + startWidth}px;
                width: ${endWidth - startWidth}px;
                height: ${rect.height}px;
                background: rgba(255, 0, 0, 0.1);
                border-bottom: 2px solid #ff4444;
                pointer-events: none;
                z-index: 10000;
                border-radius: 2px;
            `;
            
            highlight.dataset.originalWord = word;
            highlight.dataset.start = start;
            highlight.dataset.end = end;
            
            document.body.appendChild(highlight);
            
            // Store reference for cleanup
            if (!element.tamilHighlights) {
                element.tamilHighlights = [];
            }
            element.tamilHighlights.push(highlight);
        }

        // Highlight word in contenteditable element
        highlightContentEditable(element, word, start, end) {
            const textNode = this.getTextNodeAtPosition(element, start);
            if (!textNode) return;
            
            const range = document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
            
            const span = document.createElement('span');
            span.className = 'tamil-ai-word-highlight';
            span.dataset.originalWord = word;
            
            try {
                range.surroundContents(span);
            } catch (e) {
                // If surroundContents fails, use extractContents
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
            }
        }

        // Get text node at specific position
        getTextNodeAtPosition(element, position) {
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let currentPos = 0;
            let node;
            
            while (node = walker.nextNode()) {
                const nodeLength = node.textContent.length;
                if (currentPos + nodeLength >= position) {
                    return node;
                }
                currentPos += nodeLength;
            }
            
            return null;
        }

        // Clear all highlights for an element
        clearAllHighlights(element) {
            if (element.tamilHighlights) {
                element.tamilHighlights.forEach(highlight => highlight.remove());
                element.tamilHighlights = [];
            }
            
            // Remove contenteditable highlights
            const highlights = element.querySelectorAll('.tamil-ai-word-highlight');
            highlights.forEach(highlight => {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            });
        }

        // Show tooltip directly under a word (immediate response)
        showTooltipUnderWord(element, originalWord, correctedWord, start, end) {
            // Remove existing tooltip for this element
            this.hideTooltip(element);

            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip tamil-ai-immediate-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <span class="tooltip-icon">✏️</span>
                        <span class="tooltip-title">Tamil AI Suggestion</span>
                        <button class="tooltip-close">&times;</button>
                    </div>
                    <div class="tooltip-body">
                        <div class="original-word">
                            <span class="label">Original:</span>
                            <span class="word">${originalWord}</span>
                        </div>
                        <div class="corrected-word">
                            <span class="label">Suggested:</span>
                            <span class="word">${correctedWord}</span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="tooltip-apply" data-original="${originalWord}" data-corrected="${correctedWord}">
                            Apply
                        </button>
                        <button class="tooltip-ignore">
                            Ignore
                        </button>
                    </div>
                </div>
            `;

            // Position tooltip directly under the word
            this.positionTooltipDirectlyUnderWord(tooltip, element, start, end);

            // Add tooltip styles
            this.addTooltipStyles();
            this.addImmediateTooltipStyles();

            document.body.appendChild(tooltip);
            this.activeTooltips.set(element, tooltip);

            // Add event listeners
            this.setupTooltipEvents(tooltip, element, originalWord, correctedWord);
        }

        // Show tooltip for a specific word
        showTooltipForWord(element, originalWord, correctedWord, start, end) {
            // Remove existing tooltip for this element
            this.hideTooltip(element);

            const tooltip = document.createElement('div');
            tooltip.className = 'tamil-ai-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <span class="tooltip-icon">✏️</span>
                        <span class="tooltip-title">Tamil AI Suggestion</span>
                        <button class="tooltip-close">&times;</button>
                    </div>
                    <div class="tooltip-body">
                        <div class="original-word">
                            <span class="label">Original:</span>
                            <span class="word">${originalWord}</span>
                        </div>
                        <div class="corrected-word">
                            <span class="label">Suggested:</span>
                            <span class="word">${correctedWord}</span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="tooltip-apply" data-original="${originalWord}" data-corrected="${correctedWord}">
                            Apply
                        </button>
                        <button class="tooltip-ignore">
                            Ignore
                        </button>
                    </div>
                </div>
            `;

            // Position tooltip under the highlighted word
            this.positionTooltipUnderWord(tooltip, element, start, end);

            // Add tooltip styles
            this.addTooltipStyles();

            document.body.appendChild(tooltip);
            this.activeTooltips.set(element, tooltip);

            // Add event listeners
            this.setupTooltipEvents(tooltip, element, originalWord, correctedWord);
        }

        // Position tooltip directly under the word (immediate response)
        positionTooltipDirectlyUnderWord(tooltip, element, start, end) {
            const rect = element.getBoundingClientRect();
            const text = element.value || element.textContent || '';
            
            // Calculate exact word position
            const wordPosition = this.calculateWordPosition(element, text, start, end);
            
            if (wordPosition) {
                // Position tooltip directly under the word
                tooltip.style.cssText = `
                    position: absolute;
                    top: ${wordPosition.bottom + 8}px;
                    left: ${wordPosition.left}px;
                    z-index: 10000;
                    max-width: 250px;
                    pointer-events: auto;
                    animation: tooltipSlideUp 0.2s ease-out;
                `;
            } else {
                // Fallback positioning
                tooltip.style.cssText = `
                    position: absolute;
                    top: ${rect.bottom + 8}px;
                    left: ${rect.left}px;
                    z-index: 10000;
                    max-width: 250px;
                    pointer-events: auto;
                    animation: tooltipSlideUp 0.2s ease-out;
                `;
            }
        }

        // Calculate exact position of a word in the input
        calculateWordPosition(element, text, start, end) {
            // Create a temporary element to measure text
            const tempElement = document.createElement('span');
            tempElement.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: pre;
                font: inherit;
                padding: inherit;
                border: inherit;
                margin: inherit;
                line-height: inherit;
                letter-spacing: inherit;
                word-spacing: inherit;
                top: 0;
                left: 0;
            `;
            
            // Copy all computed styles from the input element
            const computedStyle = window.getComputedStyle(element);
            tempElement.style.font = computedStyle.font;
            tempElement.style.fontSize = computedStyle.fontSize;
            tempElement.style.fontFamily = computedStyle.fontFamily;
            tempElement.style.fontWeight = computedStyle.fontWeight;
            tempElement.style.letterSpacing = computedStyle.letterSpacing;
            tempElement.style.wordSpacing = computedStyle.wordSpacing;
            tempElement.style.lineHeight = computedStyle.lineHeight;
            tempElement.style.padding = computedStyle.padding;
            tempElement.style.border = computedStyle.border;
            tempElement.style.margin = computedStyle.margin;
            
            document.body.appendChild(tempElement);
            
            // Measure text up to the start of the word
            tempElement.textContent = text.substring(0, start);
            const startWidth = tempElement.offsetWidth;
            
            // Measure text up to the end of the word
            tempElement.textContent = text.substring(0, end);
            const endWidth = tempElement.offsetWidth;
            
            // Measure height
            const wordHeight = tempElement.offsetHeight;
            
            document.body.removeChild(tempElement);
            
            const rect = element.getBoundingClientRect();
            
            return {
                left: rect.left + startWidth,
                right: rect.left + endWidth,
                top: rect.top,
                bottom: rect.top + wordHeight,
                width: endWidth - startWidth
            };
        }

        // Position tooltip under the highlighted word
        positionTooltipUnderWord(tooltip, element, start, end) {
            const rect = element.getBoundingClientRect();
            const text = element.value || element.textContent || '';
            
            // Calculate word position
            const tempElement = document.createElement('span');
            tempElement.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: pre;
                font: inherit;
                padding: inherit;
                border: inherit;
                margin: inherit;
                line-height: inherit;
                letter-spacing: inherit;
                word-spacing: inherit;
            `;
            tempElement.textContent = text.substring(0, start);
            document.body.appendChild(tempElement);
            
            const startWidth = tempElement.offsetWidth;
            tempElement.textContent = text.substring(0, end);
            const endWidth = tempElement.offsetWidth;
            
            document.body.removeChild(tempElement);
            
            // Position tooltip
            const tooltipWidth = 300; // Max width from CSS
            const left = rect.left + startWidth;
            const centerLeft = left + (endWidth - startWidth) / 2 - tooltipWidth / 2;
            
            tooltip.style.cssText = `
                position: absolute;
                top: ${rect.bottom + 5}px;
                left: ${Math.max(10, centerLeft)}px;
                z-index: 10000;
                max-width: 300px;
                pointer-events: auto;
            `;
        }

        // Add highlight styles
        addHighlightStyles() {
            if (document.getElementById('tamil-ai-highlight-styles')) return;

            const style = document.createElement('style');
            style.id = 'tamil-ai-highlight-styles';
            style.textContent = `
                .tamil-ai-word-highlight {
                    background: rgba(255, 0, 0, 0.1) !important;
                    border-bottom: 2px solid #ff4444 !important;
                    border-radius: 2px !important;
                    position: relative !important;
                }
                
                .tamil-ai-input-highlight {
                    animation: highlightPulse 2s ease-in-out infinite;
                }
                
                .tamil-ai-corrected-word {
                    background: rgba(0, 255, 0, 0.1) !important;
                    border-bottom: 2px solid #28a745 !important;
                    border-radius: 2px !important;
                    position: relative !important;
                }
                
                @keyframes highlightPulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
                
                @keyframes correctionSuccess {
                    0% { background: rgba(0, 255, 0, 0.3); }
                    100% { background: rgba(0, 255, 0, 0.1); }
                }
                
                .tamil-ai-corrected-word {
                    animation: correctionSuccess 1s ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        // Add immediate tooltip styles
        addImmediateTooltipStyles() {
            if (document.getElementById('tamil-ai-immediate-tooltip-styles')) return;

            const style = document.createElement('style');
            style.id = 'tamil-ai-immediate-tooltip-styles';
            style.textContent = `
                .tamil-ai-immediate-tooltip {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 12px;
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 13px;
                    line-height: 1.4;
                    animation: tooltipSlideUp 0.3s ease-out;
                    transform-origin: top center;
                    backdrop-filter: blur(10px);
                }
                
                @keyframes tooltipSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .tamil-ai-immediate-tooltip .tooltip-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .tamil-ai-immediate-tooltip .tooltip-icon {
                    font-size: 16px;
                    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
                }
                
                .tamil-ai-immediate-tooltip .tooltip-title {
                    font-weight: 600;
                    flex: 1;
                    font-size: 13px;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
                
                .tamil-ai-immediate-tooltip .tooltip-close {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 2px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                
                .tamil-ai-immediate-tooltip .tooltip-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
                
                .tamil-ai-immediate-tooltip .tooltip-body {
                    padding: 12px;
                    background: #0f0f0f;
                }
                
                .tamil-ai-immediate-tooltip .original-word,
                .tamil-ai-immediate-tooltip .corrected-word {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: #1a1a1a;
                    border: 1px solid #333;
                }
                
                .tamil-ai-immediate-tooltip .original-word {
                    border-left: 4px solid #ff4444;
                    box-shadow: 0 0 10px rgba(255, 68, 68, 0.1);
                }
                
                .tamil-ai-immediate-tooltip .corrected-word {
                    border-left: 4px solid #00ff88;
                    box-shadow: 0 0 10px rgba(0, 255, 136, 0.1);
                }
                
                .tamil-ai-immediate-tooltip .label {
                    font-weight: 600;
                    margin-right: 8px;
                    min-width: 60px;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #888;
                    letter-spacing: 0.5px;
                }
                
                .tamil-ai-immediate-tooltip .word {
                    font-family: 'Tamil', 'Noto Sans Tamil', sans-serif;
                    font-size: 15px;
                    font-weight: 500;
                    color: #fff;
                }
                
                .tamil-ai-immediate-tooltip .tooltip-actions {
                    padding: 8px 12px;
                    background: #1a1a1a;
                    border-radius: 0 0 12px 12px;
                    display: flex;
                    gap: 8px;
                    border-top: 1px solid #333;
                }
                
                .tamil-ai-immediate-tooltip .tooltip-apply,
                .tamil-ai-immediate-tooltip .tooltip-ignore {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .tamil-ai-immediate-tooltip .tooltip-apply {
                    background: linear-gradient(135deg, #00ff88 0%, #00aaff 100%);
                    color: #000;
                    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
                }
                
                .tamil-ai-immediate-tooltip .tooltip-apply:hover {
                    box-shadow: 0 0 25px rgba(0, 255, 136, 0.5);
                    transform: translateY(-2px);
                }
                
                .tamil-ai-immediate-tooltip .tooltip-ignore {
                    background: #333;
                    color: #ccc;
                    border: 1px solid #555;
                }
                
                .tamil-ai-immediate-tooltip .tooltip-ignore:hover {
                    background: #444;
                    color: #fff;
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(style);
        }

        // Get word at specific position
        getWordAtPosition(text, position) {
            // Find word boundaries around the cursor position
            let start = position;
            let end = position;
            
            // Move start to beginning of word
            while (start > 0 && !/[\s\p{P}]/u.test(text[start - 1])) {
                start--;
            }
            
            // Move end to end of word
            while (end < text.length && !/[\s\p{P}]/u.test(text[end])) {
                end++;
            }
            
            const word = text.substring(start, end).trim();
            return word || null;
        }

        // Enable/disable tooltip system
        setEnabled(enabled) {
            this.isEnabled = enabled;
            if (!enabled) {
                // Hide all active tooltips
                this.activeTooltips.forEach((tooltip, element) => {
                    this.hideTooltip(element);
                });
            }
        }

        // Clear cache to free up memory
        clearCache() {
            this.cache.clear();
        }

        // Get cache size for debugging
        getCacheSize() {
            return this.cache.size;
        }
    }

    // Initialize tooltip system
    const tooltipSystem = new TamilTooltipSystem();
    
    // Expose tooltip system globally for control from sidepanel
    window.tooltipSystem = tooltipSystem;

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

        // Setup real-time tooltip monitoring
        tooltipSystem.setupRealTimeMonitoring();
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
                                
                                // Setup tooltip monitoring for new elements
                                tooltipSystem.attachInputListener(input);
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