#!/usr/bin/env python3
"""
Tamil AI Writing Assistant - Setup Test Script
This script tests if the project is properly set up and configured.
"""

import os
import sys
import subprocess
import requests
import json
from pathlib import Path

# Colors for output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_status(message, status="INFO"):
    color = Colors.BLUE if status == "INFO" else Colors.GREEN if status == "SUCCESS" else Colors.RED if status == "ERROR" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.NC} {message}")

def check_python():
    """Check if Python is installed and has correct version"""
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print_status(f"Python found: {version}", "SUCCESS")
        return True
    except Exception as e:
        print_status(f"Python not found: {e}", "ERROR")
        return False

def check_node():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print_status(f"Node.js found: {version}", "SUCCESS")
        return True
    except Exception as e:
        print_status(f"Node.js not found: {e}", "ERROR")
        return False

def check_backend_setup():
    """Check if backend is properly set up"""
    backend_path = Path("backend")
    
    # Check if backend directory exists
    if not backend_path.exists():
        print_status("Backend directory not found", "ERROR")
        return False
    
    # Check if virtual environment exists
    venv_path = backend_path / "venv"
    if not venv_path.exists():
        print_status("Virtual environment not found. Run setup first.", "ERROR")
        return False
    
    # Check if requirements.txt exists
    req_path = backend_path / "requirements.txt"
    if not req_path.exists():
        print_status("requirements.txt not found", "ERROR")
        return False
    
    # Check if .env file exists
    env_path = backend_path / ".env"
    if not env_path.exists():
        print_status(".env file not found. Copy from .env.example", "WARNING")
    else:
        print_status(".env file found", "SUCCESS")
    
    print_status("Backend setup looks good", "SUCCESS")
    return True

def check_extension_setup():
    """Check if Chrome extension is properly set up"""
    extension_path = Path("chrome-extension")
    
    # Check if extension directory exists
    if not extension_path.exists():
        print_status("Chrome extension directory not found", "ERROR")
        return False
    
    # Check if package.json exists
    package_path = extension_path / "package.json"
    if not package_path.exists():
        print_status("package.json not found", "ERROR")
        return False
    
    # Check if node_modules exists
    node_modules_path = extension_path / "node_modules"
    if not node_modules_path.exists():
        print_status("node_modules not found. Run 'npm install' first.", "WARNING")
    else:
        print_status("Node modules found", "SUCCESS")
    
    # Check if dist directory exists
    dist_path = extension_path / "dist"
    if not dist_path.exists():
        print_status("dist directory not found. Run 'npm run build' first.", "WARNING")
    else:
        print_status("Extension built", "SUCCESS")
    
    print_status("Chrome extension setup looks good", "SUCCESS")
    return True

def check_frontend_setup():
    """Check if frontend is properly set up"""
    frontend_path = Path("frontend")
    
    # Check if frontend directory exists
    if not frontend_path.exists():
        print_status("Frontend directory not found", "ERROR")
        return False
    
    # Check if index.html exists
    index_path = frontend_path / "index.html"
    if not index_path.exists():
        print_status("index.html not found", "ERROR")
        return False
    
    print_status("Frontend setup looks good", "SUCCESS")
    return True

def test_backend_api():
    """Test if backend API is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_status("Backend API is running", "SUCCESS")
            return True
        else:
            print_status(f"Backend API returned status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.ConnectionError:
        print_status("Backend API is not running. Start it with 'python run.py'", "WARNING")
        return False
    except Exception as e:
        print_status(f"Error testing backend API: {e}", "ERROR")
        return False

def test_gemini_api():
    """Test if Gemini API is working"""
    try:
        response = requests.get("http://localhost:8000/test-gemini", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print_status("Gemini API is working", "SUCCESS")
                return True
            else:
                print_status(f"Gemini API error: {data.get('message', 'Unknown error')}", "WARNING")
                return False
        else:
            print_status(f"Gemini API test returned status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.ConnectionError:
        print_status("Backend API is not running", "WARNING")
        return False
    except Exception as e:
        print_status(f"Error testing Gemini API: {e}", "ERROR")
        return False

def main():
    """Main test function"""
    print("=" * 50)
    print("Tamil AI Writing Assistant - Setup Test")
    print("=" * 50)
    print()
    
    # Track overall status
    all_good = True
    
    # Test prerequisites
    print_status("Testing prerequisites...")
    if not check_python():
        all_good = False
    if not check_node():
        all_good = False
    
    print()
    
    # Test project setup
    print_status("Testing project setup...")
    if not check_backend_setup():
        all_good = False
    if not check_extension_setup():
        all_good = False
    if not check_frontend_setup():
        all_good = False
    
    print()
    
    # Test running services
    print_status("Testing running services...")
    if test_backend_api():
        test_gemini_api()
    
    print()
    print("=" * 50)
    
    if all_good:
        print_status("All tests passed! Project is ready to use.", "SUCCESS")
        print()
        print("Next steps:")
        print("1. Start the backend: cd backend && source venv/bin/activate && python run.py")
        print("2. Open frontend/index.html in your browser")
        print("3. Load the Chrome extension from chrome-extension/ folder")
    else:
        print_status("Some tests failed. Please check the setup.", "ERROR")
        print()
        print("To fix issues:")
        print("1. Run setup script: ./setup.sh (Linux/macOS) or setup.bat (Windows)")
        print("2. Or follow manual setup in INSTALLATION.md")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
