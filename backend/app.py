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
    operation: str  # "live_grammar", "live_spelling", "formality_shift", "tanglish_convert"

class TextResponse(BaseModel):
    original_text: str
    corrected_text: str
    suggestions: Optional[list] = None
    errors: Optional[list] = None
    confidence: Optional[float] = None

# Improved Tamil correction prompts
CORRECTION_PROMPTS = {
    "live_grammar": """You are a Tamil language expert. Check this Tamil text for grammar and spelling errors. 
    
    Rules:
    1. Only correct actual errors, don't change correct Tamil
    2. Maintain the original meaning and tone
    3. Use proper Tamil script (தமிழ் எழுத்து)
    4. Return ONLY the corrected text, no explanations
    5. If no errors, return the original text unchanged
    
    Text to check:""",
    
    "live_spelling": """You are a Tamil spelling expert. Check this Tamil text for spelling errors only.
    
    Rules:
    1. Only fix spelling mistakes, not grammar
    2. Use correct Tamil script
    3. Return ONLY the corrected text
    4. If no spelling errors, return original text
    
    Text to check:""",
    
    "formality_shift": "Convert this Tamil text between casual and formal styles. Maintain meaning:",
    "tanglish_convert": "Convert this Tanglish (Tamil in English letters) to proper Tamil script:"
}

def call_gemini_api(prompt: str) -> str:
    """Call Gemini API using the REST API format"""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        raise Exception("GEMINI_API_KEY not found in environment variables")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    headers = {
        'Content-Type': 'application/json',
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
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            return result['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception("No response from Gemini API")
            
    except requests.exceptions.RequestException as e:
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
        
        # Get the appropriate prompt based on operation
        prompt_template = CORRECTION_PROMPTS.get(request.operation)
        if not prompt_template:
            raise HTTPException(status_code=400, detail="Invalid operation")
        
        # Create the full prompt
        full_prompt = f"{prompt_template}\n\n{request.text}"
        
        # Call Gemini API
        corrected_text = call_gemini_api(full_prompt)
        
        # Extract suggestions and errors for live correction
        suggestions = None
        errors = None
        
        if request.operation in ["live_grammar", "live_spelling"]:
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
            "type": "spelling_grammar"
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