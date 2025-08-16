class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'chatgpt_pinned_conversations';
    this.SETTINGS_KEY = 'chatgpt_pinned_settings';
  }

  async getPinnedConversations() {
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    return result[this.STORAGE_KEY] || [];
  }

  async savePinnedConversations(conversations) {
    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: conversations
    });
  }

  async addPinnedConversation(conversation) {
    const conversations = await this.getPinnedConversations();
    
    if (!conversations.find(c => c.id === conversation.id)) {
      conversations.unshift(conversation);
      await this.savePinnedConversations(conversations);
    }
    
    return conversations;
  }

  async removePinnedConversation(conversationId) {
    const conversations = await this.getPinnedConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    await this.savePinnedConversations(filtered);
    return filtered;
  }

  async updateConversationOrder(orderedIds) {
    const conversations = await this.getPinnedConversations();
    const reordered = orderedIds.map(id => 
      conversations.find(c => c.id === id)
    ).filter(Boolean);
    
    await this.savePinnedConversations(reordered);
    return reordered;
  }

  async isPinned(conversationId) {
    const conversations = await this.getPinnedConversations();
    return conversations.some(c => c.id === conversationId);
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(this.SETTINGS_KEY);
    return result[this.SETTINGS_KEY] || {
      enableDragDrop: true,
      showPinCount: true
    };
  }

  async saveSettings(settings) {
    await chrome.storage.sync.set({
      [this.SETTINGS_KEY]: settings
    });
  }
}

class ChatGPTPinnedConversations {
  constructor() {
    this.storageManager = new StorageManager();
    this.pinnedSection = null;
    this.observer = null;
    this.draggedElement = null;
    this.init();
  }

  async init() {
    await this.waitForChatInterface();
    this.setupObservers();
    this.injectPinnedSection();
    this.setupConversationDetection();
    this.setupDropdownObserver();
  }

  async waitForChatInterface() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const sidebar = document.querySelector('nav[aria-label="Chat history"]');
        if (sidebar) {
          clearInterval(checkInterval);
          resolve(sidebar);
        }
      }, 100);
    });
  }

  async injectPinnedSection() {
    const sidebar = document.querySelector('nav[aria-label="Chat history"]');
    if (!sidebar) return;

    const existingPinned = document.getElementById('pinned-conversations-section');
    if (existingPinned) existingPinned.remove();

    const pinnedConversations = await this.storageManager.getPinnedConversations();
    
    const projectsSection = Array.from(sidebar.querySelectorAll('div')).find(div => 
      div.textContent.includes('Projects') || div.querySelector('[data-testid*="project"]')
    );

    const chatsSection = Array.from(sidebar.querySelectorAll('div')).find(div => 
      div.textContent.includes('Today') || 
      div.textContent.includes('Yesterday') || 
      div.textContent.includes('Previous')
    );

    if (!chatsSection) return;

    const pinnedSection = document.createElement('div');
    pinnedSection.id = 'pinned-conversations-section';
    pinnedSection.className = 'pinned-conversations-wrapper';
    
    const pinnedHTML = `
      <div class="pinned-header">
        <h3>Pinned Conversations</h3>
        <span class="pinned-count">${pinnedConversations.length}</span>
      </div>
      <div class="pinned-conversations-list" id="pinned-list">
        ${pinnedConversations.map(conv => this.createPinnedConversationHTML(conv)).join('')}
      </div>
    `;
    
    pinnedSection.innerHTML = pinnedHTML;

    if (projectsSection) {
      projectsSection.parentNode.insertBefore(pinnedSection, projectsSection.nextSibling);
    } else {
      chatsSection.parentNode.insertBefore(pinnedSection, chatsSection);
    }

    this.pinnedSection = pinnedSection;
    this.setupDragAndDrop();
  }

  createPinnedConversationHTML(conversation) {
    return `
      <div class="pinned-conversation" data-conversation-id="${conversation.id}" draggable="true">
        <a href="/c/${conversation.id}" class="pinned-conversation-link">
          <div class="conversation-icon">📌</div>
          <div class="conversation-title">${this.escapeHtml(conversation.title)}</div>
        </a>
        <button class="unpin-button" data-conversation-id="${conversation.id}" title="Unpin conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupConversationDetection() {
    const detectCurrentConversation = () => {
      const url = window.location.pathname;
      const match = url.match(/\/c\/([a-f0-9-]+)/i);
      return match ? match[1] : null;
    };

    window.addEventListener('popstate', () => {
      this.updatePinButtons();
    });

    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      window.dispatchEvent(new Event('pushstate'));
    };

    window.addEventListener('pushstate', () => {
      this.updatePinButtons();
    });

    this.currentConversationId = detectCurrentConversation();
  }

  setupDropdownObserver() {
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const dropdown = node.querySelector('[role="menu"]') || (node.matches('[role="menu"]') ? node : null);
            if (dropdown && this.isConversationDropdown(dropdown)) {
              await this.addPinButton(dropdown);
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isConversationDropdown(dropdown) {
    const hasShareButton = dropdown.querySelector('button[aria-label*="Share"]') || 
                          dropdown.textContent.includes('Share');
    const hasRenameButton = dropdown.querySelector('button[aria-label*="Rename"]') || 
                           dropdown.textContent.includes('Rename');
    return hasShareButton || hasRenameButton;
  }

  async addPinButton(dropdown) {
    const existingPin = dropdown.querySelector('.pin-conversation-button');
    if (existingPin) return;

    const conversationId = this.getCurrentConversationId();
    if (!conversationId) return;

    const isPinned = await this.storageManager.isPinned(conversationId);
    
    const firstButton = dropdown.querySelector('button');
    if (!firstButton) return;

    const pinButton = document.createElement('button');
    pinButton.className = 'pin-conversation-button';
    pinButton.setAttribute('role', 'menuitem');
    
    const buttonStyle = window.getComputedStyle(firstButton);
    pinButton.style.cssText = firstButton.style.cssText;
    pinButton.className = firstButton.className + ' pin-conversation-button';
    
    pinButton.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isPinned ? 
            '<path d="M5 12l5 5L20 7"></path>' : 
            '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>'
          }
        </svg>
        <span>${isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
      </div>
    `;

    pinButton.addEventListener('click', async () => {
      await this.togglePin(conversationId);
      dropdown.remove();
    });

    firstButton.parentNode.insertBefore(pinButton, firstButton.nextSibling);
  }

  getCurrentConversationId() {
    const url = window.location.pathname;
    const match = url.match(/\/c\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  async togglePin(conversationId) {
    const isPinned = await this.storageManager.isPinned(conversationId);
    
    if (isPinned) {
      await this.storageManager.removePinnedConversation(conversationId);
    } else {
      const title = document.title.replace(' - ChatGPT', '').trim();
      await this.storageManager.addPinnedConversation({
        id: conversationId,
        title: title,
        timestamp: Date.now()
      });
    }
    
    await this.injectPinnedSection();
    this.updatePinButtons();
  }

  async updatePinButtons() {
    const dropdowns = document.querySelectorAll('[role="menu"]');
    for (const dropdown of dropdowns) {
      if (this.isConversationDropdown(dropdown)) {
        await this.addPinButton(dropdown);
      }
    }
  }

  setupDragAndDrop() {
    const pinnedList = document.getElementById('pinned-list');
    if (!pinnedList) return;

    pinnedList.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('pinned-conversation')) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    pinnedList.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('pinned-conversation')) {
        e.target.classList.remove('dragging');
      }
    });

    pinnedList.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(pinnedList, e.clientY);
      if (afterElement == null) {
        pinnedList.appendChild(this.draggedElement);
      } else {
        pinnedList.insertBefore(this.draggedElement, afterElement);
      }
    });

    pinnedList.addEventListener('drop', async (e) => {
      e.preventDefault();
      const conversations = [...pinnedList.querySelectorAll('.pinned-conversation')];
      const orderedIds = conversations.map(el => el.dataset.conversationId);
      await this.storageManager.updateConversationOrder(orderedIds);
    });

    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('unpin-button') || e.target.closest('.unpin-button')) {
        e.preventDefault();
        const button = e.target.closest('.unpin-button');
        const conversationId = button.dataset.conversationId;
        await this.togglePin(conversationId);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.pinned-conversation:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  setupObservers() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes[this.storageManager.STORAGE_KEY]) {
        this.injectPinnedSection();
      }
    });
  }
}

if (window.location.hostname === 'chat.openai.com' || window.location.hostname === 'chatgpt.com') {
  new ChatGPTPinnedConversations();
}