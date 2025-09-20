@echo off
REM Tamil AI Writing Assistant - Setup Script for Windows
REM This script sets up the entire project for development

echo 🚀 Setting up Tamil AI Writing Assistant...

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Python found

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js found

REM Setup backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment
echo [INFO] Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy .env.example .env
    echo [WARNING] Please edit backend\.env and add your GEMINI_API_KEY
) else (
    echo [SUCCESS] .env file already exists
)

cd ..

REM Setup Chrome extension
echo [INFO] Setting up Chrome extension...
cd chrome-extension

REM Install npm dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Build the extension
echo [INFO] Building Chrome extension...
npm run build

cd ..

echo.
echo ==========================================
echo [SUCCESS] Setup completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit backend\.env and add your GEMINI_API_KEY
echo 2. Start the backend: cd backend ^&^& venv\Scripts\activate ^&^& python run.py
echo 3. Load the Chrome extension from chrome-extension\ folder
echo 4. Open frontend\index.html in your browser
echo.
echo For detailed instructions, see README.md
pause
