# Installation Guide

This guide provides detailed installation instructions for different operating systems and deployment methods.

## 📋 Prerequisites

Before installing the Tamil AI Writing Assistant, ensure you have:

- **Python 3.8+** (for backend)
- **Node.js 16+** (for Chrome extension)
- **Chrome Browser** (for extension)
- **Git** (for cloning the repository)
- **Gemini API Key** (get it from [Google AI Studio](https://aistudio.google.com/))

## 🖥️ Platform-Specific Instructions

### Windows

#### Method 1: Automated Setup (Recommended)

1. **Clone the repository:**
   ```cmd
   git clone https://github.com/yourusername/tamil-ai-assistant.git
   cd tamil-ai-assistant
   ```

2. **Run the setup script:**
   ```cmd
   setup.bat
   ```

3. **Configure environment:**
   - Edit `backend\.env` and add your Gemini API key
   - Replace `your-gemini-api-key-here` with your actual API key

4. **Start the application:**
   ```cmd
   cd backend
   venv\Scripts\activate
   python run.py
   ```

#### Method 2: Manual Setup

1. **Install Python:**
   - Download from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation

2. **Install Node.js:**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose the LTS version

3. **Clone and setup:**
   ```cmd
   git clone https://github.com/yourusername/tamil-ai-assistant.git
   cd tamil-ai-assistant
   ```

4. **Setup backend:**
   ```cmd
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   copy .env.example .env
   # Edit .env with your API key
   python run.py
   ```

5. **Setup Chrome extension:**
   ```cmd
   cd chrome-extension
   npm install
   npm run build
   ```

### macOS

#### Method 1: Automated Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/tamil-ai-assistant.git
   cd tamil-ai-assistant
   ```

2. **Make setup script executable and run:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment:**
   ```bash
   # Edit the .env file
   nano backend/.env
   # Add your Gemini API key
   ```

4. **Start the application:**
   ```bash
   cd backend
   source venv/bin/activate
   python run.py
   ```

#### Method 2: Using Homebrew

1. **Install dependencies:**
   ```bash
   # Install Homebrew if not already installed
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Python and Node.js
   brew install python node
   ```

2. **Follow the manual setup steps from Windows Method 2**

### Linux (Ubuntu/Debian)

#### Method 1: Automated Setup (Recommended)

1. **Install system dependencies:**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nodejs npm git
   ```

2. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/tamil-ai-assistant.git
   cd tamil-ai-assistant
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure and start:**
   ```bash
   # Edit environment file
   nano backend/.env
   
   # Start the application
   cd backend
   source venv/bin/activate
   python run.py
   ```

#### Method 2: Using Snap (Ubuntu)

1. **Install snap packages:**
   ```bash
   sudo snap install python --classic
   sudo snap install node --classic
   ```

2. **Follow the manual setup steps**

### Linux (CentOS/RHEL/Fedora)

1. **Install dependencies:**
   ```bash
   # For CentOS/RHEL
   sudo yum install python3 python3-pip nodejs npm git
   
   # For Fedora
   sudo dnf install python3 python3-pip nodejs npm git
   ```

2. **Follow the Ubuntu setup steps**

## 🐳 Docker Installation

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/tamil-ai-assistant.git
   cd tamil-ai-assistant
   ```

2. **Configure environment:**
   ```bash
   # Copy and edit environment file
   cp backend/.env.example backend/.env
   nano backend/.env  # Add your Gemini API key
   ```

3. **Run with Docker Compose:**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```

4. **Access the application:**
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:3000

### Docker Commands

```bash
# Build and run backend only
docker build -t tamil-ai-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env tamil-ai-backend

# Build Chrome extension
docker-compose run --rm extension-builder

# View running containers
docker-compose ps

# Restart services
docker-compose restart

# Update and rebuild
docker-compose up --build
```

## 🔧 Chrome Extension Installation

### After Building the Extension

1. **Open Chrome and go to Extensions:**
   - Type `chrome://extensions/` in the address bar
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch in the top right

3. **Load the Extension:**
   - Click "Load unpacked"
   - Navigate to the `chrome-extension` folder
   - Select the folder and click "Select Folder"

4. **Verify Installation:**
   - The extension should appear in your extensions list
   - You should see the Tamil AI icon in your browser toolbar

### Using the Extension

1. **Click the extension icon** in your browser toolbar
2. **Enter Tamil text** in the input field
3. **Select the operation type:**
   - Live Grammar Check
   - Live Spelling Check
   - Formality Shift
   - Tanglish to Tamil
4. **Click "Process Text"** to see results

## 🚀 Quick Start Commands

### Development Mode

```bash
# Backend (Terminal 1)
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python run.py

# Chrome Extension (Terminal 2)
cd chrome-extension
npm run dev

# Frontend (Terminal 3)
cd frontend
python -m http.server 3000
```

### Production Mode

```bash
# Using Docker
docker-compose up -d

# Or manually
cd backend
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Python Not Found
```bash
# Check Python installation
python3 --version

# If not found, install Python 3.8+
# Windows: Download from python.org
# macOS: brew install python
# Linux: sudo apt install python3
```

#### 2. Node.js Not Found
```bash
# Check Node.js installation
node --version
npm --version

# If not found, install Node.js 16+
# Windows: Download from nodejs.org
# macOS: brew install node
# Linux: sudo apt install nodejs npm
```

#### 3. Permission Denied (Linux/macOS)
```bash
# Make setup script executable
chmod +x setup.sh

# Or run with bash
bash setup.sh
```

#### 4. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change port in run.py
```

#### 5. API Key Issues
- Ensure your `.env` file is in the `backend` directory
- Check that the API key is correct and active
- Verify the key has proper permissions in Google AI Studio

#### 6. Chrome Extension Not Loading
- Make sure you've built the extension: `npm run build`
- Check that Developer mode is enabled
- Try refreshing the extensions page
- Check the browser console for errors

### Getting Help

1. **Check the logs:**
   ```bash
   # Backend logs
   cd backend
   python run.py  # Look for error messages
   
   # Docker logs
   docker-compose logs backend
   ```

2. **Verify installation:**
   ```bash
   # Test backend
   curl http://localhost:8000/health
   
   # Test API key
   curl http://localhost:8000/test-gemini
   ```

3. **Create an issue:**
   - Check existing issues on GitHub
   - Create a new issue with:
     - Your operating system
     - Error messages
     - Steps to reproduce

## 📝 Next Steps

After successful installation:

1. **Test the API:**
   - Visit http://localhost:8000
   - Check http://localhost:8000/test-gemini

2. **Try the web interface:**
   - Open `frontend/index.html` in your browser
   - Test with sample Tamil text

3. **Install the Chrome extension:**
   - Follow the extension installation steps
   - Test on various websites

4. **Explore the features:**
   - Grammar checking
   - Spelling correction
   - Formality shifting
   - Tanglish conversion

## 🆘 Support

If you encounter any issues:

1. Check this installation guide
2. Review the main README.md
3. Search existing GitHub issues
4. Create a new issue with detailed information

Happy coding! 🎉
