# Contributing to ChatGPT Pinned Conversations

Thank you for your interest in contributing to ChatGPT Pinned Conversations! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 🐛 Reporting Bugs

Before creating a bug report, please check the existing issues to avoid duplicates.

**To submit a bug report:**

1. Use the GitHub issue tracker
2. Include a clear title and description
3. Provide steps to reproduce the issue
4. Include your browser version, OS, and extension version
5. Add screenshots if applicable
6. Include console errors if any

**Bug Report Template:**
```
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
Add screenshots to help explain your problem.

**Environment:**
- Browser: [e.g., Chrome 120.0.6099.129]
- OS: [e.g., Windows 11, macOS 14.1]
- Extension Version: [e.g., 1.0.0]

**Additional Context**
Any other context about the problem.
```

### ✨ Suggesting Features

We welcome feature suggestions! Please:

1. Check existing feature requests first
2. Explain the use case and benefit
3. Provide mockups or examples if possible
4. Consider how it fits with the extension's goals

**Feature Request Template:**
```
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Explain why this feature would be useful.

**Proposed Solution**
Describe how you envision this feature working.

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

### 💻 Code Contributions

#### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/chatgpt-pinned-conversations.git
   cd chatgpt-pinned-conversations
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Load the extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

#### Development Guidelines

**Code Style:**
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

**File Organization:**
- `content.js`: Main extension logic
- `background.js`: Service worker functionality
- `popup.*`: Extension popup interface
- `options.*`: Settings page
- `styles.css`: UI styling

**JavaScript Best Practices:**
- Use `const` and `let` instead of `var`
- Use async/await for promises
- Handle errors gracefully
- Add console logging for debugging

**Chrome Extension Best Practices:**
- Follow Manifest V3 standards
- Use chrome.storage.sync for data persistence
- Minimize permissions requested
- Ensure content security policy compliance

#### Testing Your Changes

Before submitting a pull request:

1. **Functional Testing**
   - Test all pin/unpin operations
   - Verify drag & drop reordering
   - Check cross-device sync (if possible)
   - Test options page functionality

2. **Compatibility Testing**
   - Test on both chat.openai.com and chatgpt.com
   - Verify light and dark theme compatibility
   - Test with different screen sizes
   - Check keyboard navigation

3. **Performance Testing**
   - Ensure no memory leaks
   - Verify smooth navigation
   - Check for console errors

#### Submitting Changes

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve bug description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List what you've tested

**Pull Request Template:**
```
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested pin/unpin functionality
- [ ] Tested drag & drop reordering
- [ ] Tested options page
- [ ] Tested on both ChatGPT domains
- [ ] Tested light/dark themes

## Screenshots
Add screenshots for UI changes.

## Related Issues
Fixes #(issue number)
```

## 📋 Development Setup

### Prerequisites
- Google Chrome browser
- Basic knowledge of JavaScript and Chrome Extensions
- Git for version control

### Project Structure
```
chatgpt-pinned-conversations/
├── manifest.json          # Extension configuration
├── content.js             # Main extension logic
├── background.js           # Service worker
├── popup.html             # Popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── options.html           # Options page
├── options.js             # Options functionality
├── options.css            # Options styling
├── styles.css             # Injected styles
├── README.md              # Documentation
├── LICENSE                # MIT License
├── CONTRIBUTING.md        # This file
└── .gitignore            # Git ignore rules
```

### Key Components

**Content Script (`content.js`)**
- Injects the pinned conversations UI
- Handles pin/unpin button creation
- Manages drag & drop functionality
- Detects conversations and updates indicators

**Background Script (`background.js`)**
- Handles extension lifecycle events
- Provides conversation data to popup

**Storage Management**
- Uses `chrome.storage.sync` for cross-device sync
- Stores pinned conversations and settings
- Handles import/export functionality

## 🔧 Technical Considerations

### Chrome Extension APIs
- **Storage API**: For data persistence and sync
- **Tabs API**: For conversation detection
- **Runtime API**: For messaging between components

### Content Security Policy
- No inline scripts or styles
- All external resources must be bundled
- Use nonce or hash for any dynamic content

### Performance
- Minimize DOM queries
- Use event delegation for dynamic content
- Debounce rapid operations
- Clean up event listeners

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- High contrast compatibility
- Screen reader friendly

## 🚨 Common Issues

### Extension Not Loading
- Check manifest.json syntax
- Verify all file paths are correct
- Check browser console for errors

### Content Script Not Injecting
- Verify host permissions in manifest
- Check if ChatGPT's DOM structure changed
- Ensure script runs at correct timing

### Storage Issues
- Verify chrome.storage permissions
- Check for quota limits
- Handle sync conflicts gracefully

### UI Integration Problems
- ChatGPT UI updates may break styling
- Use robust selectors
- Test on both light/dark themes

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Content Scripts Guide](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

## 🤔 Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Create a new discussion for general questions
3. Create an issue for specific bugs or features
4. Reach out to maintainers if needed

## 📝 License

By contributing to ChatGPT Pinned Conversations, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ChatGPT Pinned Conversations! 🎉