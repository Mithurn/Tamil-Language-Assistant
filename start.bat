@echo off
REM Tamil AI Writing Assistant - Start Script for Windows
REM This script starts all components of the application

echo ==========================================
echo   Tamil AI Writing Assistant
echo ==========================================
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo [ERROR] .env file not found in backend directory
    echo [WARNING] Please run setup.bat first or create backend\.env manually
    pause
    exit /b 1
)

REM Check if API key is set
findstr /C:"GEMINI_API_KEY=your-gemini-api-key-here" backend\.env >nul
if %errorlevel% equ 0 (
    echo [WARNING] Please update backend\.env with your actual GEMINI_API_KEY
    echo [WARNING] You can get your API key from: https://aistudio.google.com/
) else (
    echo [SUCCESS] Environment configuration found
)

echo.
echo [INFO] Starting services...
echo.

REM Start backend
echo [INFO] Starting backend server...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo [ERROR] Virtual environment not found. Please run setup.bat first
    pause
    exit /b 1
)

REM Activate virtual environment and start server
echo [INFO] Backend starting on http://localhost:8000
start "Backend Server" cmd /k "venv\Scripts\activate && python run.py"

cd ..

REM Start frontend
echo [INFO] Starting frontend server...
cd frontend

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Frontend starting on http://localhost:3000
    start "Frontend Server" cmd /k "python -m http.server 3000"
    echo [SUCCESS] Frontend started
) else (
    echo [WARNING] Python not found. Please open frontend\index.html manually in your browser
)

cd ..

echo.
echo ==========================================
echo [SUCCESS] Application started successfully!
echo ==========================================
echo.
echo Services running:
echo • Backend API: http://localhost:8000
echo • Frontend: http://localhost:3000
echo • API Docs: http://localhost:8000/docs
echo.
echo Chrome Extension:
echo 1. Go to chrome://extensions/
echo 2. Enable Developer mode
echo 3. Load unpacked: chrome-extension\ folder
echo.
echo Press any key to exit...
pause >nul
