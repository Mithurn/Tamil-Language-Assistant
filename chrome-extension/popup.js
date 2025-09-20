// Tamil AI Extension Popup Script

document.addEventListener('DOMContentLoaded', function() {
    const spellCheckToggle = document.getElementById('spellCheckToggle');
    const spellCheckStatus = document.getElementById('spellCheckStatus');
    const spellCheckStatusText = document.getElementById('spellCheckStatusText');
    const testButton = document.getElementById('testButton');
    
    // Load current settings
    loadSettings();
    
    // Set up event listeners
    spellCheckToggle.addEventListener('click', toggleSpellCheck);
    testButton.addEventListener('click', testSpellCheck);
    
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['spellCheckEnabled']);
            const enabled = result.spellCheckEnabled !== false; // Default to true
            
            updateToggleUI(enabled);
            updateStatusUI(enabled);
        } catch (error) {
            console.error('Error loading settings:', error);
            updateStatusUI(false, 'Error loading settings');
        }
    }
    
    async function toggleSpellCheck() {
        try {
            const currentState = spellCheckToggle.classList.contains('active');
            const newState = !currentState;
            
            // Update storage
            await chrome.storage.sync.set({ spellCheckEnabled: newState });
            
            // Update UI
            updateToggleUI(newState);
            updateStatusUI(newState);
            
            // Send message to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleSpellCheck',
                    enabled: newState
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Could not send message to content script:', chrome.runtime.lastError);
                    } else {
                        console.log('Spell check toggled:', response);
                    }
                });
            }
            
        } catch (error) {
            console.error('Error toggling spell check:', error);
            updateStatusUI(false, 'Error toggling spell check');
        }
    }
    
    async function testSpellCheck() {
        testButton.disabled = true;
        testButton.textContent = 'Testing...';
        
        try {
            // Test API connection
            const response = await fetch('http://localhost:8000/health');
            if (response.ok) {
                testButton.textContent = '✅ API Connected';
                testButton.style.background = '#10b981';
                
                // Test spell check endpoint
                const spellTest = await fetch('http://localhost:8000/process-text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: 'வநக்கம்',
                        operation: 'spell_check'
                    })
                });
                
                if (spellTest.ok) {
                    const data = await spellTest.json();
                    if (data.corrected_text && data.corrected_text.trim() !== 'வநக்கம்') {
                        testButton.textContent = '✅ Spell Check Working';
                    } else {
                        testButton.textContent = '⚠️ API Working (No Correction)';
                        testButton.style.background = '#f59e0b';
                    }
                } else {
                    testButton.textContent = '❌ Spell Check Failed';
                    testButton.style.background = '#ef4444';
                }
            } else {
                testButton.textContent = '❌ API Not Connected';
                testButton.style.background = '#ef4444';
            }
        } catch (error) {
            console.error('Test failed:', error);
            testButton.textContent = '❌ Connection Failed';
            testButton.style.background = '#ef4444';
        }
        
        // Reset button after 3 seconds
        setTimeout(() => {
            testButton.disabled = false;
            testButton.textContent = 'Test Spell Check';
            testButton.style.background = '#3b82f6';
        }, 3000);
    }
    
    function updateToggleUI(enabled) {
        if (enabled) {
            spellCheckToggle.classList.add('active');
        } else {
            spellCheckToggle.classList.remove('active');
        }
    }
    
    function updateStatusUI(enabled, customText = null) {
        if (customText) {
            spellCheckStatusText.textContent = customText;
            spellCheckStatus.classList.remove('active');
        } else {
            if (enabled) {
                spellCheckStatus.classList.add('active');
                spellCheckStatusText.textContent = 'Spell Check Enabled';
            } else {
                spellCheckStatus.classList.remove('active');
                spellCheckStatusText.textContent = 'Spell Check Disabled';
            }
        }
    }
    
    // Check extension status on load
    checkExtensionStatus();
    
    async function checkExtensionStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'getSpellCheckStatus'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Content script not responding:', chrome.runtime.lastError);
                        updateStatusUI(false, 'Extension not active on this page');
                    } else if (response && response.success) {
                        updateToggleUI(response.enabled);
                        updateStatusUI(response.enabled);
                    }
                });
            }
        } catch (error) {
            console.error('Error checking extension status:', error);
        }
    }
});
