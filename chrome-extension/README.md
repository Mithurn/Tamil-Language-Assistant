# Tamil AI Chrome Extension

A modern Chrome extension for Tamil language grammar assistance.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Chrome browser
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

### Development

- **Watch mode (auto-rebuild):**
  ```bash
  npm run dev
  ```

- **Clean build:**
  ```bash
  npm run clean && npm run build
  ```

## 🎨 Features

- **Modern Dark UI** - Inspired by the reference design
- **Chat Interface** - Conversational Tamil AI assistant
- **Topic Selection** - Grammar, Tanglish conversion, Formality shift
- **Voice Input** - Simulated voice input (ready for Web Speech API)
- **Real-time Processing** - Live Tamil text correction
- **Side Panel** - Advanced text processing interface
- **Context Menu** - Right-click Tamil text for quick correction

## 🏗 Architecture

- **React 18** - Modern component-based UI
- **Tailwind CSS** - Utility-first styling with custom Tamil theme
- **Webpack 5** - Module bundling and optimization
- **Chrome Extension Manifest V3** - Latest extension API

## 📁 Project Structure

```
chrome-extension/
├── src/
│   ├── components/          # Reusable React components
│   ├── popup/              # Popup interface
│   ├── sidepanel/          # Side panel interface
│   ├── content/            # Content script
│   ├── background/         # Background script
│   └── styles/             # Tailwind CSS
├── dist/                   # Built extension files
├── icons/                  # Extension icons
└── manifest.json          # Extension configuration
```

## 🎯 Usage

1. **Popup Interface:**
   - Click the extension icon
   - Select a topic (Grammar, Tanglish, Formality)
   - Chat with the AI assistant

2. **Side Panel:**
   - Right-click on Tamil text
   - Select "Open Tamil AI Panel"
   - Use advanced processing features

3. **Context Menu:**
   - Select Tamil text on any webpage
   - Right-click and choose Tamil AI options
   - Get instant corrections

## 🔧 Configuration

The extension connects to your backend API at `http://localhost:8000`. Make sure your Tamil AI backend is running before using the extension.

## 🎨 Customization

- **Colors:** Edit `tailwind.config.js` for theme customization
- **Components:** Modify files in `src/components/`
- **Styling:** Update `src/styles/main.css` for custom styles

## 🚀 Future Enhancements

- Web Speech API integration for real voice input
- More Tamil language features
- Offline mode support
- Advanced text analysis

