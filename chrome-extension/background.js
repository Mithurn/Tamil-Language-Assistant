// Background script for Tamil AI extension
console.log('Tamil AI Extension: Background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Tamil AI Extension installed');
        // Open welcome page or show notification
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkAPI') {
        // Check if API is available
        fetch('http://localhost:8000/health')
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Inject content script if needed
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(error => {
            // Ignore errors for restricted pages
            console.log('Could not inject content script:', error);
        });
    }
});