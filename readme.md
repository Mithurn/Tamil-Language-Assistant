<h1 align="center">
  <br>
  <a>
    <img width="200" height="200" alt="icon copy" src="https://github.com/user-attachments/assets/a1ecc8d7-36ef-43e0-9a0d-b6fb2d5a6e3b" />
  </a>
  <br>
  Tamil Language Assistant
  <br>
</h1>

<h4 align="center">An AI-powered Chrome extension that detects, corrects, and enhances Tamil text in real-time across all websites and applications.</h4>

<p align="center">
  <a href="https://chrome.google.com/webstore/detail/tamil-text-corrector">
    <img src="https://img.shields.io/badge/Chrome-Extension-4285F4.svg?style=flat-square&logo=google-chrome" alt="Chrome Extension">
  </a>
  <a href="https://github.com/Mithurn/tamil-text-corrector">
    <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E.svg?style=flat-square&logo=javascript" alt="JavaScript">
  </a>
  <a href="https://github.com/Mithurn/tamil-text-corrector">
    <img src="https://img.shields.io/badge/AI-Powered-FF6B6B.svg?style=flat-square" alt="AI Powered">
  </a>
  <a href="https://github.com/Mithurn/tamil-text-corrector">
    <img src="https://img.shields.io/badge/Real--time-Correction-00C851.svg?style=flat-square" alt="Real-time">
  </a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a>
</p>

## 🎬 **Real-time Tamil Text Detection**

**Watch as the extension instantly detects Tamil text and provides correction suggestions**

<img width="1162" height="585" alt="Screenshot 2025-10-02 at 11 35 56 PM" src="https://github.com/user-attachments/assets/d8e90887-1728-4a24-b265-9663d2eb354c" />

## 🧠 **AI-Powered Context-Aware Corrections**

**Advanced AI understands the context of your Tamil text to provide more relevant and accurate corrections**

<img width="1467" height="831" alt="Screenshot 2025-09-21 at 11 27 30 AM copy" src="https://github.com/user-attachments/assets/9e297ece-e2ed-4ce9-a34a-e0a3e1c1f63b" />

## 🎯 **Dynamic Correction in Action**

**See the extension actively correcting Tamil text in real-time as you type**

<div align="center">
  <img src="https://github.com/user-attachments/assets/c8e5fff9-3d4b-4186-8167-058ab4583f30" width="900" height="600" alt="Tamil Text Corrector Demo GIF">
</div>

## 🌐 **Universal Platform Integration**

**Seamless integration across Gmail, WhatsApp Web, and social media platforms**

<img width="637" height="169" alt="Screenshot 2025-10-02 at 11 35 13 PM" src="https://github.com/user-attachments/assets/e2e61610-6cf9-441f-8904-9326e9999132" />

<img width="1415" height="584" alt="Screenshot 2025-10-02 at 11 36 23 PM" src="https://github.com/user-attachments/assets/d9b16b61-6af3-46c0-b060-eb6789647163" />

## Key Features

* **Real-time Tamil Text Detection** - Instantly identifies Tamil text as you type
  - Works across all websites, social media platforms, and web applications.
* **AI-Powered Corrections**
  - Advanced machine learning algorithms provide accurate spelling and grammar corrections.
* **Context-Aware Suggestions**
  - Understands the context of your text to provide more relevant corrections.
* **Universal Compatibility**
  - Works seamlessly on Gmail, WhatsApp Web, Facebook, Twitter, and any website.
* **One-Click Corrections**
  - Apply corrections instantly with a single click or keyboard shortcut.
* **Customizable Settings**
  - Adjust sensitivity, correction preferences, and user interface options.
* **Privacy-First Design**
  - All text processing happens locally - your data never leaves your device.
* **Lightweight & Fast**
  - Minimal performance impact with optimized algorithms.
* **Multi-Platform Support**
  - Compatible with Chrome, Edge, and other Chromium-based browsers.
* **Offline Functionality**
  - Works without internet connection for basic corrections.

## How It Works

The extension uses advanced natural language processing to:

1. **Monitor Text Input** - Continuously watches for Tamil text in input fields
2. **Analyze Context** - Understands the meaning and context of your text
3. **Generate Suggestions** - Provides accurate correction recommendations
4. **Apply Corrections** - Allows instant application of suggested fixes

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/tamil-text-corrector)
2. Click "Add to Chrome"
3. Confirm installation
4. The extension will be ready to use immediately

### Manual Installation (Development)
```bash
# Clone the repository
$ git clone https://github.com/Mithurn/tamil-text-corrector.git

# Go into the repository
$ cd tamil-text-corrector

# Load the extension in Chrome
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory
```

## Usage

### Basic Usage
1. **Install the extension** from the Chrome Web Store
2. **Navigate to any website** (Gmail, WhatsApp Web, etc.)
3. **Start typing in Tamil** - the extension will automatically detect text
4. **View suggestions** - corrections will appear as you type
5. **Apply corrections** - click on suggestions or use keyboard shortcuts

### Advanced Features
- **Custom Shortcuts** - Set up keyboard shortcuts for quick corrections
- **Sensitivity Settings** - Adjust how aggressively the extension suggests corrections
- **Whitelist Sites** - Choose which websites to enable the extension on
- **Correction History** - View and manage your correction history

## Tech Stack

This extension is built using:

- **[JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Web/JavaScript)** - Core extension logic and text processing
- **[Chrome Extensions API](https://developer.chrome.com/docs/extensions/)** - Browser integration and permissions
- **[Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)** - Real-time text monitoring and injection
- **[Natural Language Processing](https://en.wikipedia.org/wiki/Natural_language_processing)** - AI-powered text analysis and correction
- **[Tamil Language Models](https://en.wikipedia.org/wiki/Tamil_language)** - Specialized algorithms for Tamil text processing
- **[Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)** - Modern Chrome extension architecture
- **[Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)** - DOM manipulation and text processing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/Mithurn/tamil-text-corrector.git
cd tamil-text-corrector

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome for testing
# Follow manual installation steps above
```

## Privacy & Security

This extension is built with privacy as a core principle:

- ✅ **Local Processing** - All text analysis happens on your device
- ✅ **No Data Collection** - Your text is never sent to external servers
- ✅ **Open Source** - Full transparency in how your data is handled
- ✅ **Minimal Permissions** - Only requests necessary browser permissions

## Support

If you like this extension and find it helpful, consider:

- ⭐ **Starring the repository** on GitHub
- 📝 **Leaving a review** on the Chrome Web Store
- 🐛 **Reporting bugs** or suggesting features
- 🤝 **Contributing** to the project

## You may also like...

- [Prompter AI](https://github.com/Mithurn/to-do-ai) - AI-powered productivity co-pilot
- [Instagram Analytics Dashboard](https://github.com/Mithurn/instagram-profile-webscraper) - Comprehensive Instagram analytics system
- [More Projects](https://github.com/Mithurn) - Check out my other projects on GitHub

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


- 🌐 **Website**: [mithurnjeromme.vercel.app](https://mithurnjeromme.vercel.app)
- 💼 **LinkedIn**: [linkedin.com/in/mithurn-jeromme-s-k](https://www.linkedin.com/in/mithurn-jeromme-s-k/)
- 🐙 **GitHub**: [github.com/Mithurn](https://github.com/Mithurn)
- 📧 **Email**: mithurnjeromme172@gmail.com
- 🐦 **Twitter**: [@Mithurn_Jeromme](https://x.com/Mithurn_Jeromme)
