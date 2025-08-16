class OptionsManager {
  constructor() {
    this.STORAGE_KEY = 'chatgpt_pinned_conversations';
    this.SETTINGS_KEY = 'chatgpt_pinned_settings';
    this.draggedElement = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadPinnedConversations();
    this.attachEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(this.SETTINGS_KEY);
    const settings = result[this.SETTINGS_KEY] || {
      enableDragDrop: true,
      showPinCount: true
    };

    document.getElementById('enableDragDrop').checked = settings.enableDragDrop;
    document.getElementById('showPinCount').checked = settings.showPinCount;
  }

  async saveSettings() {
    const settings = {
      enableDragDrop: document.getElementById('enableDragDrop').checked,
      showPinCount: document.getElementById('showPinCount').checked
    };

    await chrome.storage.sync.set({
      [this.SETTINGS_KEY]: settings
    });
  }

  async loadPinnedConversations() {
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    const conversations = result[this.STORAGE_KEY] || [];
    
    const pinnedList = document.getElementById('pinnedList');
    
    if (conversations.length === 0) {
      pinnedList.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <p>No pinned conversations yet</p>
          <p class="empty-description">Pin conversations from ChatGPT to see them here</p>
        </div>
      `;
    } else {
      pinnedList.innerHTML = conversations.map((conv, index) => `
        <div class="pinned-item" data-conversation-id="${conv.id}" draggable="true">
          <div class="pinned-item-content">
            <div class="drag-handle">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="pinned-title">${this.escapeHtml(conv.title)}</span>
          </div>
          <div class="pinned-actions">
            <button class="move-button move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19V5M12 5l-7 7M12 5l7 7"/>
              </svg>
            </button>
            <button class="move-button move-down" data-index="${index}" ${index === conversations.length - 1 ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M12 19l7-7M12 19l-7-7"/>
              </svg>
            </button>
            <button class="remove-button" data-conversation-id="${conv.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');
      
      this.setupDragAndDrop();
    }
  }

  setupDragAndDrop() {
    const pinnedItems = document.querySelectorAll('.pinned-item');
    
    pinnedItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(e.currentTarget.parentNode, e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (afterElement == null) {
          e.currentTarget.parentNode.appendChild(dragging);
        } else {
          e.currentTarget.parentNode.insertBefore(dragging, afterElement);
        }
      });
    });

    document.getElementById('pinnedList').addEventListener('drop', async (e) => {
      e.preventDefault();
      await this.saveNewOrder();
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.pinned-item:not(.dragging)')];
    
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

  async saveNewOrder() {
    const items = document.querySelectorAll('.pinned-item');
    const orderedIds = Array.from(items).map(item => item.dataset.conversationId);
    
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    const conversations = result[this.STORAGE_KEY] || [];
    
    const reordered = orderedIds.map(id => 
      conversations.find(c => c.id === id)
    ).filter(Boolean);
    
    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: reordered
    });
    
    await this.loadPinnedConversations();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    document.getElementById('enableDragDrop').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('showPinCount').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('clearAll').addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all pinned conversations? This cannot be undone.')) {
        await chrome.storage.sync.set({ [this.STORAGE_KEY]: [] });
        await this.loadPinnedConversations();
      }
    });

    document.getElementById('exportData').addEventListener('click', async () => {
      const result = await chrome.storage.sync.get([this.STORAGE_KEY, this.SETTINGS_KEY]);
      const data = {
        conversations: result[this.STORAGE_KEY] || [],
        settings: result[this.SETTINGS_KEY] || {},
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatgpt-pinned-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('importData').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.conversations && Array.isArray(data.conversations)) {
          await chrome.storage.sync.set({
            [this.STORAGE_KEY]: data.conversations,
            [this.SETTINGS_KEY]: data.settings || {}
          });
          
          await this.loadSettings();
          await this.loadPinnedConversations();
          alert('Data imported successfully!');
        } else {
          alert('Invalid import file format');
        }
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
      
      e.target.value = '';
    });

    document.addEventListener('click', async (e) => {
      if (e.target.closest('.move-up')) {
        const index = parseInt(e.target.closest('.move-up').dataset.index);
        await this.moveConversation(index, index - 1);
      } else if (e.target.closest('.move-down')) {
        const index = parseInt(e.target.closest('.move-down').dataset.index);
        await this.moveConversation(index, index + 1);
      } else if (e.target.closest('.remove-button')) {
        const conversationId = e.target.closest('.remove-button').dataset.conversationId;
        await this.removeConversation(conversationId);
      }
    });
  }

  async moveConversation(fromIndex, toIndex) {
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    const conversations = result[this.STORAGE_KEY] || [];
    
    if (toIndex < 0 || toIndex >= conversations.length) return;
    
    const [removed] = conversations.splice(fromIndex, 1);
    conversations.splice(toIndex, 0, removed);
    
    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: conversations
    });
    
    await this.loadPinnedConversations();
  }

  async removeConversation(conversationId) {
    if (!confirm('Are you sure you want to remove this pinned conversation?')) return;
    
    const result = await chrome.storage.sync.get(this.STORAGE_KEY);
    const conversations = result[this.STORAGE_KEY] || [];
    const filtered = conversations.filter(c => c.id !== conversationId);
    
    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: filtered
    });
    
    await this.loadPinnedConversations();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});