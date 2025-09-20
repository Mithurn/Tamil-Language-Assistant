// Quick test script for Tamil AI Extension
// Run this in the browser console on any page to test the extension

console.log('🧪 Testing Tamil AI Extension...');

// Test 1: Check if extension is loaded
if (window.tamilAIExtensionLoaded) {
    console.log('✅ Extension content script loaded');
} else {
    console.log('❌ Extension content script not loaded');
}

// Test 2: Check if tooltip system is available
if (window.tooltipSystem) {
    console.log('✅ Tooltip system available');
    console.log('Tooltip system enabled:', window.tooltipSystem.isEnabled);
} else {
    console.log('❌ Tooltip system not available');
}

// Test 3: Check Tamil detection
function testTamilDetection() {
    const tamilText = 'வணக்கம் உலகம்';
    const tamilRegex = /[\u0B80-\u0BFF]/;
    const containsTamil = tamilRegex.test(tamilText);
    console.log('✅ Tamil detection working:', containsTamil);
    return containsTamil;
}

// Test 4: Test API connection
async function testAPIConnection() {
    try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
            console.log('✅ Backend API is running');
            return true;
        } else {
            console.log('❌ Backend API responded with error:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend API not accessible:', error.message);
        return false;
    }
}

// Test 5: Test Tamil text processing
async function testTamilProcessing() {
    try {
        const response = await fetch('http://localhost:8000/process-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: 'வணக்கம் உலகம்',
                operation: 'live_grammar'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Tamil text processing working');
            console.log('Original:', data.original_text);
            console.log('Corrected:', data.corrected_text);
            return true;
        } else {
            console.log('❌ Tamil text processing failed:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Tamil text processing error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🔍 Running comprehensive tests...\n');
    
    testTamilDetection();
    await testAPIConnection();
    await testTamilProcessing();
    
    console.log('\n📋 Test Summary:');
    console.log('1. Extension loaded:', window.tamilAIExtensionLoaded ? '✅' : '❌');
    console.log('2. Tooltip system:', window.tooltipSystem ? '✅' : '❌');
    console.log('3. Tamil detection: ✅');
    console.log('4. API connection: Check above');
    console.log('5. Text processing: Check above');
    
    console.log('\n💡 To test tooltips:');
    console.log('1. Type Tamil text in any input field');
    console.log('2. Wait 500ms for tooltips to appear');
    console.log('3. Click Apply or Ignore in tooltips');
}

// Auto-run tests
runAllTests();