from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import Optional
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Tamil AI Writing Assistant", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    operation: str  # "live_grammar"

class TextResponse(BaseModel):
    original_text: str
    corrected_text: str
    suggestions: Optional[list] = None
    errors: Optional[list] = None
    confidence: Optional[float] = None

# Tamil grammar correction prompt
CORRECTION_PROMPTS = {
    "live_grammar": """You are a Tamil language expert. Check this Tamil text for grammar errors. 
    
    Rules:
    1. Only correct actual errors, don't change correct Tamil
    2. Maintain the original meaning and tone
    3. Use proper Tamil script (தமிழ் எழுத்து)
    4. Return ONLY the corrected text, no explanations
    5. If no errors, return the original text unchanged
    
    Text to check:""",
    
    "spell_check": """You are a Tamil language expert. Check this Tamil word for spelling errors.
    
    Rules:
    1. Only correct spelling errors, don't change correct Tamil words
    2. Return ONLY the correctly spelled word, no explanations
    3. Use proper Tamil script (தமிழ் எழுத்து)
    4. If the word is already correct, return the original word unchanged
    5. Focus on common spelling mistakes in Tamil
    
    Word to check:"""
}

# Simple fallback spell check dictionary for common Tamil words
FALLBACK_SPELL_CHECK = {
    "வநக்கம்": "வணக்கம்",
    "போறேன்": "போகிறேன்", 
    "செல்றேன்": "செல்கிறேன்",
    "வர்றேன்": "வருகிறேன்",
    "படிக்க்றேன்": "படிக்கிறேன்",
    "எழுத்றேன்": "எழுதுகிறேன்",
    "கேட்ட்றேன்": "கேட்டேன்",
    "சொன்ன்றேன்": "சொன்னேன்",
    "வந்த்றேன்": "வந்தேன்",
    "போன்றேன்": "போனேன்"
}

def call_gemini_api(prompt: str) -> str:
    """Call Gemini API using the REST API format with X-goog-api-key header"""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise Exception("GEMINI_API_KEY not found in environment variables")
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': api_key
    }
    
    data = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        # Handle rate limiting
        if response.status_code == 429:
            raise Exception("Rate limit exceeded. Please wait a moment and try again.")
        
        response.raise_for_status()
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception("No response from Gemini API")
            
    except requests.exceptions.Timeout:
        raise Exception("API request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        if "429" in str(e):
            raise Exception("Rate limit exceeded. Please wait a moment and try again.")
        raise Exception(f"API request failed: {str(e)}")
    except KeyError as e:
        raise Exception(f"Unexpected API response format: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Tamil AI Writing Assistant API", "status": "running"}

@app.post("/process-text", response_model=TextResponse)
async def process_text(request: TextRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # For spell check, try fallback first if available
        if request.operation == "spell_check" and request.text in FALLBACK_SPELL_CHECK:
            corrected_text = FALLBACK_SPELL_CHECK[request.text]
            suggestions = extract_corrections(request.text, corrected_text)
            errors = find_errors(request.text, corrected_text)
            
            return TextResponse(
                original_text=request.text,
                corrected_text=corrected_text,
                suggestions=suggestions,
                errors=errors,
                confidence=0.9
            )
        
        # Get the appropriate prompt based on operation
        prompt_template = CORRECTION_PROMPTS.get(request.operation)
        if not prompt_template:
            raise HTTPException(status_code=400, detail="Invalid operation")
        
        # Create the full prompt
        simple_prompt = f"{prompt_template}\n\n{request.text}"
        
        try:
            # Call Gemini API with simplified prompt
            corrected_text = call_gemini_api(simple_prompt)
        except Exception as api_error:
            # If API fails and it's spell check, try fallback
            if request.operation == "spell_check":
                if request.text in FALLBACK_SPELL_CHECK:
                    corrected_text = FALLBACK_SPELL_CHECK[request.text]
                else:
                    # No fallback available, return original text
                    corrected_text = request.text
            else:
                # For other operations, re-raise the error
                raise api_error
        
        # Extract suggestions and errors for live correction
        suggestions = extract_corrections(request.text, corrected_text)
        errors = find_errors(request.text, corrected_text)
        
        return TextResponse(
            original_text=request.text,
            corrected_text=corrected_text,
            suggestions=suggestions,
            errors=errors,
            confidence=0.85
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")

def extract_corrections(original: str, corrected: str) -> list:
    """Extract what was corrected"""
    if original.strip() == corrected.strip():
        return []
    
    suggestions = []
    if original != corrected:
        suggestions.append(f"Suggested: {corrected}")
    return suggestions

def find_errors(original: str, corrected: str) -> list:
    """Find specific errors in the text"""
    errors = []
    if original.strip() != corrected.strip():
        errors.append({
            "original": original,
            "corrected": corrected,
            "type": "grammar"
        })
    return errors

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.get("/test-gemini")
async def test_gemini():
    """Test endpoint to verify Gemini API is working"""
    try:
        test_prompt = "Say 'Hello' in Tamil"
        result = call_gemini_api(test_prompt)
        return {"status": "success", "message": "Gemini API is working", "test_result": result}
    except Exception as e:
        return {"status": "error", "message": f"Gemini API test failed: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)