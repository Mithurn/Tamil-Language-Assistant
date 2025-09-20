#!/usr/bin/env python3

import requests
import json

def test_api():
    """Test the Tamil AI API endpoint"""
    
    url = "http://localhost:8000/process-text"
    
    # Test data with intentional Tamil errors
    test_cases = [
        {
            "text": "வணக்கம்",  # Greeting - should be correct
            "operation": "live_grammar"
        },
        {
            "text": "நான் போறேன்",  # Should be corrected to "நான் போகிறேன்"
            "operation": "live_grammar"
        },
        {
            "text": "வநக்கம்",  # Misspelled greeting
            "operation": "live_grammar"
        }
    ]
    
    print("Testing Tamil AI API...")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['text']}")
        
        try:
            response = requests.post(url, json=test_case, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success:")
                print(f"   Original: {test_case['text']}")
                print(f"   Corrected: {data.get('corrected_text', 'No correction')}")
                
                if data.get('corrected_text') and data['corrected_text'] != test_case['text']:
                    print(f"   🔧 Correction needed: YES")
                else:
                    print(f"   ✅ No correction needed")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            
        print("-" * 30)

if __name__ == "__main__":
    test_api()