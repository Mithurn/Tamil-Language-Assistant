// Debug script to check extension status on any page
// Run this in the browser console to debug the extension

console.log('=== Tamil AI Extension Debug ===');

// Check if content script is loaded
if (window.tamilAIExtensionLoaded) {
    console.log('✅ Content script is loaded');
} else {
    console.log('❌ Content script is NOT loaded');
}

// Check if extension global exists
if (typeof tamilSpellCheckSystem !== 'undefined') {
    console.log('✅ TamilSpellCheckSystem exists');
    console.log('Spell check enabled:', tamilSpellCheckSystem.enabled);
} else {
    console.log('❌ TamilSpellCheckSystem does not exist');
}

// Check for input fields
const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], textarea, [contenteditable="true"]');
console.log(`Found ${inputs.length} input fields`);

inputs.forEach((input, index) => {
    const hasListener = input.dataset.tamilSpellCheckListener === 'true';
    console.log(`Input ${index}:`, {
        type: input.type || input.tagName,
        hasListener: hasListener,
        id: input.id,
        className: input.className
    });
});

// Check Chrome extension API
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome extension API available');
    console.log('Extension ID:', chrome.runtime.id);
} else {
    console.log('❌ Chrome extension API not available');
}

// Test API connection
fetch('http://localhost:8000/health')
    .then(response => response.json())
    .then(data => {
        console.log('✅ API connection successful:', data);
    })
    .catch(error => {
        console.log('❌ API connection failed:', error);
    });

// Check for tooltips
const tooltips = document.querySelectorAll('.tamil-spell-tooltip');
console.log(`Found ${tooltips.length} active tooltips`);

console.log('=== Debug Complete ===');
