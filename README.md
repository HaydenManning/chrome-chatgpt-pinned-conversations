# 📌 ChatGPT Pinned Conversations

A Chrome extension that allows you to pin and organize your favorite ChatGPT conversations for quick access. Keep your most important conversations at the top of your sidebar!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/)

## ✨ Features

### 🎯 Core Functionality

- **📌 Pin/Unpin Conversations**: Add conversations to your pinned list with one click
- **🔝 Dedicated Pinned Section**: View all pinned conversations above the regular chat list
- **🎨 Visual Indicators**: Pinned conversations show a golden star in the main chat list
- **⚡ Instant Feedback**: Button text updates immediately when pinning/unpinning

### 🎛️ Organization & Management

- **🖱️ Drag & Drop Reordering**: Easily reorganize your pinned conversations
- **⬆️⬇️ Manual Reordering**: Use up/down buttons in the options page
- **🗑️ Quick Unpinning**: Remove pins directly from the pinned section
- **📊 Empty State**: Clean "No pinned conversations" message when list is empty

### 💾 Data & Sync

- **☁️ Cross-Device Sync**: Uses Chrome sync storage to keep your pins across devices
- **📤 Export/Import**: Backup and restore your pinned conversations as JSON
- **🔄 Real-time Updates**: Changes sync instantly across all your Chrome instances

### 🎪 User Experience

- **🚫 No Page Reloads**: Clicking pinned conversations uses ChatGPT's smooth navigation
- **🎯 Context-Aware**: Pin/unpin buttons show correct state for each conversation
- **🌓 Theme Support**: Works seamlessly in both light and dark modes
- **⚙️ Settings Page**: Comprehensive options for customization

## 🚀 Installation

### Option 1: Install from Chrome Web Store

_Coming soon - currently in development_

### Option 2: Install as Developer Extension

1. **Download the Extension**

   ```bash
   git clone https://github.com/HaydenManning/chrome-chatgpt-pinned-conversations.git
   cd chatgpt-pinned-conversations
   ```

2. **Load in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the downloaded directory
   - The extension will be installed and ready to use!

3. **Verify Installation**
   - Navigate to [ChatGPT](https://chatgpt.com)
   - You should see a "Pinned Conversations" section in the sidebar
   - Open any conversation's menu (...) to see the Pin/Unpin option

## 📖 Usage Guide

### 🎯 Basic Usage

1. **Pin a Conversation**

   - Navigate to [ChatGPT](https://chatgpt.com) or [chat.openai.com](https://chat.openai.com)
   - Open any conversation
   - Click the three dots (...) menu for the conversation
   - Select "Pin Conversation"
   - The conversation will appear in the "Pinned Conversations" section

2. **Unpin a Conversation**

   - Method 1: Click the star button next to the pinned conversation
   - Method 2: Open the conversation's menu (...) and select "Unpin Conversation"

3. **Reorder Pinned Conversations**
   - **Drag & Drop**: Simply drag conversations up or down in the pinned section
   - **Manual**: Use the options page for precise control

### 🎛️ Advanced Features

#### Extension Popup

- Click the extension icon in your toolbar
- View all pinned conversations in a compact list
- Quick access to pin the current conversation
- Direct link to options page

#### Options Page

- Right-click the extension icon and select "Options"
- **Settings**: Toggle drag & drop functionality, show pin count
- **Management**: Manually reorder conversations with up/down buttons
- **Data**: Export/import your pinned conversations
- **Maintenance**: Clear all pinned conversations

#### Visual Indicators

- **Golden Stars**: Pinned conversations show a ⭐ icon in the main chat list
- **No Duplicates**: Stars only appear in the main list, not in the pinned section
- **Real-time Updates**: Indicators update immediately when pinning/unpinning

## 🛠️ Technical Details

### 🏗️ Architecture

- **Manifest V3**: Uses the latest Chrome extension standards
- **Content Script Injection**: Seamlessly integrates with ChatGPT's interface
- **Storage API**: Leverages `chrome.storage.sync` for cross-device synchronization
- **URL Pattern Matching**: Robust conversation detection via `/c/<uuid>` patterns

### 🔧 File Structure

```
chatgpt-pinned-conversations/
├── manifest.json          # Extension configuration
├── content.js             # Main logic injected into ChatGPT pages
├── background.js           # Service worker for background tasks
├── popup.html/js/css       # Extension popup interface
├── options.html/js/css     # Settings and management page
├── styles.css              # Styles for injected UI elements
├── README.md               # This file
└── LICENSE                 # MIT License
```

### 🎨 UI Integration

- **Non-intrusive Design**: Matches ChatGPT's existing UI patterns
- **CSS Class Compatibility**: Uses ChatGPT's own styling classes
- **Responsive Layout**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 🔒 Privacy & Security

- **Local Storage Only**: All data stored in Chrome's sync storage
- **No External Requests**: Zero network calls or data transmission
- **Domain Restricted**: Only active on ChatGPT domains
- **Minimal Permissions**: Only requests necessary Chrome API access

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports

1. Check existing issues first
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Console errors (if any)

### ✨ Feature Requests

1. Search existing feature requests
2. Explain the use case and benefit
3. Provide mockups or examples if possible

### 💻 Development

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### 🧪 Testing

- Test on both light and dark themes
- Verify cross-device sync functionality
- Check compatibility with ChatGPT updates
- Ensure accessibility standards

## 📊 Roadmap

### v1.1 (Planned)

- [ ] Keyboard shortcuts for pinning
- [ ] Pin conversation folders/categories
- [ ] Search within pinned conversations
- [ ] Custom pin icons

### v1.2 (Planned)

- [ ] Pin conversation notes/tags
- [ ] Import/export to other formats
- [ ] Bulk pin/unpin operations
- [ ] Advanced filtering options

## ❓ FAQ

**Q: Does this extension work with ChatGPT Plus?**
A: Yes! The extension works with all ChatGPT subscription tiers.

**Q: Will my pinned conversations sync across devices?**
A: Yes, as long as you're signed into Chrome with the same account.

**Q: Does this affect ChatGPT's performance?**
A: No, the extension uses minimal resources and doesn't interfere with ChatGPT's functionality.

**Q: What happens if ChatGPT updates their interface?**
A: The extension is designed to be resilient, but we monitor ChatGPT updates and release fixes promptly.

**Q: Can I pin conversations from both chat.openai.com and chatgpt.com?**
A: Yes, the extension works on both domains seamlessly.

## 🐛 Known Issues

- None currently reported! 🎉

## 📝 Changelog

### v1.0.0 (Initial Release)

- ✅ Pin/unpin conversations functionality
- ✅ Dedicated pinned conversations section
- ✅ Drag & drop reordering
- ✅ Cross-device sync
- ✅ Options page with export/import
- ✅ Visual indicators for pinned conversations
- ✅ Smooth navigation without page reloads

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to OpenAI for creating ChatGPT
- Inspired by the need for better conversation organization
- Built with love for the ChatGPT community

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/HaydenManning/chrome-chatgpt-pinned-conversations/issues)
- **Discussions**: [GitHub Discussions](https://github.com/HaydenManning/chrome-chatgpt-pinned-conversations/discussions)
- **Email**: your-email@example.com

---

<div align="center">
  <strong>Made with ❤️ for the ChatGPT community</strong>
  <br><br>
  <a href="#-chatgpt-pinned-conversations">⬆️ Back to Top</a>
</div>
