class PopupManager {
  constructor() {
    this.STORAGE_KEY = 'chatgpt_pinned_conversations';
    this.init();
  }

  async init() {
    await this.loadPinnedConversations();
    this.attachEventListeners();
    await this.checkCurrentTab();
  }

  async loadPinnedConversations() {
    const pinnedList = document.getElementById('pinnedList');
    
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const conversations = result[this.STORAGE_KEY] || [];
      
      if (conversations.length === 0) {
        pinnedList.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <p>No pinned conversations yet</p>
          </div>
        `;
      } else {
        pinnedList.innerHTML = conversations.map(conv => `
          <a href="https://chatgpt.com/c/${conv.id}" class="pinned-item" target="_blank">
            <div class="pinned-item-title">${this.escapeHtml(conv.title)}</div>
            <div class="pinned-item-date">${this.formatDate(conv.timestamp)}</div>
          </a>
        `).join('');
      }
    } catch (error) {
      pinnedList.innerHTML = `
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Error loading conversations</p>
        </div>
      `;
    }
  }

  async checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pinButton = document.getElementById('pinCurrent');
    
    if (!tab || !tab.url || (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com'))) {
      pinButton.disabled = true;
      pinButton.textContent = 'Open ChatGPT to pin';
      return;
    }
    
    const conversationId = this.extractConversationId(tab.url);
    if (!conversationId) {
      pinButton.disabled = true;
      pinButton.textContent = 'No conversation to pin';
      return;
    }
    
    const isPinned = await this.isConversationPinned(conversationId);
    if (isPinned) {
      pinButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12l5 5L20 7"></path>
        </svg>
        Conversation Pinned
      `;
      pinButton.disabled = true;
    }
  }

  extractConversationId(url) {
    const match = url.match(/\/c\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  async isConversationPinned(conversationId) {
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    const conversations = result[this.STORAGE_KEY] || [];
    return conversations.some(c => c.id === conversationId);
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    document.getElementById('openOptions').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    document.getElementById('pinCurrent').addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      
      const conversationId = this.extractConversationId(tab.url);
      if (!conversationId) return;
      
      const title = tab.title.replace(' - ChatGPT', '').trim();
      
      const result = await chrome.storage.sync.get(this.STORAGE_KEY);
      const conversations = result[this.STORAGE_KEY] || [];
      
      if (!conversations.find(c => c.id === conversationId)) {
        conversations.unshift({
          id: conversationId,
          title: title,
          timestamp: Date.now()
        });
        
        await chrome.storage.sync.set({
          [this.STORAGE_KEY]: conversations
        });
        
        await this.loadPinnedConversations();
        await this.checkCurrentTab();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});