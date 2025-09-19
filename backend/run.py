import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  WARNING: GEMINI_API_KEY not found in environment variables")
        print("Please set your Gemini API key in the .env file:")
        print("GEMINI_API_KEY=your-actual-api-key-here")
        print("\nOr set it as an environment variable:")
        print("export GEMINI_API_KEY='your-actual-api-key-here'")
        print("\nStarting server anyway... (API calls will fail)")
    else:
        print("✅ GEMINI_API_KEY found!")
    
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)