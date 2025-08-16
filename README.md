# ChatGPT Pinned Conversations

A Chrome extension that allows you to pin and organize your favorite ChatGPT conversations for quick access.

## Features

- **Pin Conversations**: Add pin/unpin buttons to ChatGPT conversation dropdown menus
- **Pinned Section**: View all pinned conversations in a dedicated section above the chat list
- **Drag & Drop Reordering**: Easily reorganize your pinned conversations
- **Cross-Device Sync**: Uses Chrome sync storage to keep your pins across devices
- **Options Page**: Manage settings and manually reorder conversations
- **Export/Import**: Backup and restore your pinned conversations

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory
4. The extension will be installed and ready to use

### Generate Icons

1. Open `generate-icons.html` in Chrome
2. The page will automatically download icon files
3. Move the downloaded icons to the `icons/` folder

## Usage

1. Navigate to [ChatGPT](https://chatgpt.com)
2. Open any conversation
3. Click the three dots (...) menu for the conversation
4. Select "Pin Conversation" to pin it
5. Pinned conversations appear in a dedicated section at the top of the sidebar

### Features

- **Popup**: Click the extension icon to see all pinned conversations
- **Options Page**: Right-click the extension icon and select "Options" to:
  - Toggle drag & drop functionality
  - Manually reorder conversations
  - Export/import your data
  - Clear all pinned conversations

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Storage**: Uses `chrome.storage.sync` for cross-device synchronization
- **URL Pattern Detection**: Identifies conversations by `/c/<uuid>` pattern
- **Production Ready**: Avoids brittle CSS selectors and uses robust detection methods

## Development

The extension consists of:

- `manifest.json`: Extension configuration
- `content.js`: Injected into ChatGPT pages, handles UI modifications
- `background.js`: Service worker for handling background tasks
- `popup.html/js/css`: Extension popup interface
- `options.html/js/css`: Settings and management page
- `styles.css`: Styles for injected UI elements

## Privacy

This extension:
- Only works on chat.openai.com and chatgpt.com domains
- Stores data locally in Chrome sync storage
- Does not send data to external servers
- Only accesses conversation titles and IDs

## License

MIT License - feel free to modify and distribute as needed.