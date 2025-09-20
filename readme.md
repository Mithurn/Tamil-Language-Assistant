# Tamil AI Writing Assistant

An intelligent AI-powered writing assistant for Tamil language that provides spell check, grammar correction, formality shifting, and Tanglish to Tamil conversion.

## 🌟 Features

- **Advanced Spell & Grammar Correction**: Catches complex errors that other tools miss
- **Contextual Formality Shifter**: Converts text between casual (பேச்சுத்தமிழ்) and professional (செந்தமிழ்) Tamil
- **Tanglish to Tamil Conversion**: Transliterates Tamil typed with English letters into proper Tamil script
- **Chrome Extension**: Works directly in your browser on Gmail, Facebook, and other websites
- **Web Interface**: Clean and simple web interface for text processing

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** (for Chrome extension)
- **Chrome Browser** (for extension)
- **Gemini API Key** (get it from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tamil-ai-assistant.git
cd tamil-ai-assistant
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the backend server
python run.py
```

The backend will be available at `http://localhost:8000`

### 3. Chrome Extension Setup

```bash
# Navigate to chrome-extension directory
cd chrome-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome:
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the chrome-extension folder
```

### 4. Web Frontend

Open `frontend/index.html` in your browser or serve it with a local server:

```bash
# Using Python
cd frontend
python -m http.server 3000

# Using Node.js
npx serve frontend
```

## 📁 Project Structure

```
tamil-ai-assistant/
├── backend/                 # FastAPI backend server
│   ├── app.py              # Main API application
│   ├── run.py              # Server runner
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── chrome-extension/       # Chrome extension
│   ├── src/               # Source files
│   ├── dist/              # Built extension files
│   ├── manifest.json      # Extension manifest
│   └── package.json       # Node.js dependencies
├── frontend/              # Web interface
│   ├── index.html         # Main HTML file
│   ├── script.js          # Frontend JavaScript
│   └── styles.css         # Styling
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### API Endpoints

- `GET /` - API status
- `POST /process-text` - Process Tamil text
- `GET /health` - Health check
- `GET /test-gemini` - Test Gemini API connection

### Supported Operations

- `live_grammar` - Grammar correction
- `live_spelling` - Spelling correction
- `formality_shift` - Convert between casual/formal Tamil
- `tanglish_convert` - Convert Tanglish to Tamil script

## 🐳 Docker Setup (Optional)

```bash
# Build and run with Docker
docker-compose up --build

# Or run individual services
docker build -t tamil-ai-backend ./backend
docker run -p 8000:8000 --env-file ./backend/.env tamil-ai-backend
```

## 🛠️ Development

### Backend Development

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Chrome Extension Development

```bash
cd chrome-extension
npm run dev  # Watch mode for development
```

## 📝 Usage Examples

### Web Interface

1. Open `frontend/index.html` in your browser
2. Enter Tamil text in the input field
3. Select the operation type
4. Click "Process Text" to see results

### Chrome Extension

1. Install the extension in Chrome
2. Click the extension icon on any webpage
3. Enter Tamil text and select operation
4. Get real-time corrections and suggestions

### API Usage

```bash
curl -X POST "http://localhost:8000/process-text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "வணக்கம் உலகம்",
    "operation": "live_grammar"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not found"**
   - Make sure you've created a `.env` file in the backend directory
   - Verify your API key is correct

2. **Chrome extension not loading**
   - Make sure you've built the extension with `npm run build`
   - Check that Developer mode is enabled in Chrome

3. **CORS errors**
   - The backend is configured to allow all origins for development
   - For production, update the CORS settings in `app.py`

4. **Port already in use**
   - Change the port in `run.py` or kill the process using port 8000

### Getting Help

- Check the [Issues](https://github.com/yourusername/tamil-ai-assistant/issues) page
- Create a new issue if you don't find a solution

## 🎯 Roadmap

- [ ] Add more Tamil language models
- [ ] Implement document analysis
- [ ] Add plagiarism checking
- [ ] Create mobile app
- [ ] Add batch processing
- [ ] Implement user accounts and history

## 🙏 Acknowledgments

- Google Gemini AI for language processing
- FastAPI for the backend framework
- React for the Chrome extension UI
- Tamil language community for feedback and testing
