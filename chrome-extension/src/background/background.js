// Background script for Tamil AI extension
console.log('Tamil AI Extension: Background script loaded');

// Create context menu on installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed, creating context menus...');
    createContextMenus();
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
    // For now, just show a notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: 'Tamil AI Assistant',
        message: 'Select Tamil text and right-click to use Grammar Check'
    });
});

// Create context menus
function createContextMenus() {
    console.log('Creating context menus...');
    
    // Remove existing menus first
    chrome.contextMenus.removeAll(() => {
        console.log('Removed existing menus');
        
        // Create main Tamil AI menu
        chrome.contextMenus.create({
            id: 'tamil-ai-main',
            title: 'Tamil AI Assistant',
            contexts: ['selection']
        }, () => {
            console.log('Created main Tamil AI menu');
        });

        // Create submenu - Grammar Check
        chrome.contextMenus.create({
            id: 'grammar-check',
            parentId: 'tamil-ai-main',
            title: 'Grammar Check',
            contexts: ['selection']
        }, () => {
            console.log('Created grammar check menu');
        });

        // Create submenu - Spell Check
        chrome.contextMenus.create({
            id: 'spell-check',
            parentId: 'tamil-ai-main',
            title: 'Spell Check',
            contexts: ['selection']
        }, () => {
            console.log('Created spell check menu');
        });
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu clicked:', info.menuItemId);
    
    if (info.selectionText) {
        console.log('Processing text with function:', info.menuItemId);
        processTextWithFunction(info.selectionText, info.menuItemId, tab.id);
    }
});

// Process text with specific function
async function processTextWithFunction(text, functionId, tabId) {
    console.log('Processing text:', text, 'with function:', functionId);
    
    const operations = {
        'grammar-check': 'live_grammar',
        'spell-check': 'spell_check'
    };

    const operation = operations[functionId];
    if (!operation) {
        console.log('No operation found for function:', functionId);
        return;
    }

    try {
        console.log('Sending request to API...');
        const response = await fetch('http://localhost:8000/process-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                operation: operation
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('API response:', data);
            
            // First, ensure content script is injected
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['dist/content.js']
                });
                console.log('Content script injected successfully');
                
                // Wait a bit for the script to load
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Now send the message
                await chrome.tabs.sendMessage(tabId, {
                    action: 'showResult',
                    originalText: text,
                    correctedText: data.corrected_text,
                    function: functionId
                });
                console.log('Message sent to content script successfully');
            } catch (error) {
                console.error('Error with content script:', error);
                // Fallback: show result in console
                console.log('Result:', data.corrected_text);
                // Use notification instead of alert
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon.png',
                    title: 'Tamil AI Result',
                    message: `Original: ${text}\nCorrected: ${data.corrected_text}`
                });
            }
        } else {
            console.error('API request failed:', response.status);
        }
    } catch (error) {
        console.error('Error processing text:', error);
    }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'checkAPI') {
        fetch('http://localhost:8000/health')
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

// Handle tab updates - but don't inject automatically since manifest handles it
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Content script is automatically injected via manifest
    // This listener is kept for potential future use
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
    }
});