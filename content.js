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
    this.updateTimeout = null;
    this.observerTimeout = null;
    this.isInjecting = false; // Flag to prevent multiple injections
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
        // Look for the history div that contains the chats
        const historyDiv = document.getElementById('history');
        if (historyDiv) {
          clearInterval(checkInterval);
          console.log('ChatGPT Pinned: Found history div');
          resolve(historyDiv);
        }
      }, 100);
    });
  }

  async injectPinnedSection() {
    // Prevent multiple simultaneous injections
    if (this.isInjecting) {
      console.log('ChatGPT Pinned: Already injecting, skipping');
      return;
    }
    
    this.isInjecting = true;
    
    try {
      const historyDiv = document.getElementById('history');
      if (!historyDiv) {
        console.log('ChatGPT Pinned: History div not found');
        return;
      }

      // Update visual indicators for pinned conversations in the main chat list
      await this.updatePinnedIndicators();

      // Check if section already exists
      const existingPinned = document.getElementById('pinned-conversations-section');
      
      // If updating existing section, just update the content smoothly
      if (existingPinned) {
        const pinnedConversations = await this.storageManager.getPinnedConversations();
        
        // Get the current content area (everything except the header)
        const header = existingPinned.querySelector('h2');
        const contentArea = existingPinned.children.length > 1 ? 
          Array.from(existingPinned.children).slice(1) : [];
        
        // Remove old content but keep header
        contentArea.forEach(element => element.remove());
        
        // Add new content
        if (pinnedConversations.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-pinned-state';
          emptyState.textContent = 'No pinned conversations';
          existingPinned.appendChild(emptyState);
        } else {
          pinnedConversations.forEach(conv => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.createPinnedConversationHTML(conv);
            existingPinned.appendChild(tempDiv.firstElementChild);
          });
        }
        
        this.pinnedSection = existingPinned;
        this.setupDragAndDrop();
        console.log('ChatGPT Pinned: Updated existing section');
        return;
      }

    const pinnedConversations = await this.storageManager.getPinnedConversations();
    console.log('ChatGPT Pinned: Loading pinned conversations:', pinnedConversations.length);
    
    // Find the first aside element that contains the chats
    const firstAside = historyDiv.querySelector('aside');
    if (!firstAside) {
      console.log('ChatGPT Pinned: Could not find aside element');
      return;
    }

    // Create a new aside element that matches the structure
    const pinnedAside = document.createElement('aside');
    pinnedAside.className = firstAside.className;
    pinnedAside.id = 'pinned-conversations-section';
    pinnedAside.setAttribute('aria-labelledby', 'pinned-conversations-label');
    
    // Set initial opacity to 0 to prevent flicker
    pinnedAside.style.opacity = '0';
    pinnedAside.style.transition = 'opacity 0.2s ease-in-out';
    
    // Create the structure matching ChatGPT's format
    pinnedAside.innerHTML = `
      <h2 class="__menu-label" id="pinned-conversations-label">Pinned Conversations</h2>
      ${pinnedConversations.map(conv => this.createPinnedConversationHTML(conv)).join('')}
      ${pinnedConversations.length === 0 ? '<div class="empty-pinned-state">No pinned conversations</div>' : ''}
    `;

      // Insert before the first aside (Chats section)
      historyDiv.insertBefore(pinnedAside, firstAside);
      
      // Fade in after a brief delay to prevent flicker
      requestAnimationFrame(() => {
        pinnedAside.style.opacity = '1';
      });
      
      console.log('ChatGPT Pinned: Injected pinned section');

      this.pinnedSection = pinnedAside;
      this.setupDragAndDrop();
    } catch (error) {
      console.error('ChatGPT Pinned: Error injecting section:', error);
    } finally {
      this.isInjecting = false;
    }
  }

  createPinnedConversationHTML(conversation) {
    return `
      <a
        tabindex="0"
        data-fill=""
        class="group __menu-item hoverable pinned-conversation"
        draggable="true"
        data-conversation-id="${conversation.id}"
        data-conversation-url="/c/${conversation.id}"
        data-discover="true"
      >
        <div class="flex min-w-0 grow items-center gap-2.5 group-data-no-contents-gap:gap-0">
          <div class="truncate">
            <span class="" dir="auto">${this.escapeHtml(conversation.title)}</span>
          </div>
        </div>
        <div class="trailing highlight text-token-text-tertiary">
          <button
            tabindex="0"
            data-trailing-button=""
            class="__menu-item-trailing-btn unpin-button"
            data-conversation-id="${conversation.id}"
            aria-label="Unpin conversation"
            type="button"
            title="Unpin conversation"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"></path>
              </svg>
            </div>
          </button>
        </div>
      </a>
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
            // Check if the node itself is a menu or contains one
            const menus = [];
            if (node.matches && node.matches('[role="menu"]')) {
              menus.push(node);
            }
            if (node.querySelectorAll) {
              menus.push(...node.querySelectorAll('[role="menu"]'));
            }
            
            for (const dropdown of menus) {
              if (this.isConversationDropdown(dropdown)) {
                console.log('ChatGPT Pinned: Found conversation dropdown');
                await this.addPinButton(dropdown);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('ChatGPT Pinned: Dropdown observer started');
  }

  isConversationDropdown(dropdown) {
    // Check for common conversation menu items
    const menuText = dropdown.textContent || '';
    const hasShareOption = menuText.includes('Share');
    const hasRenameOption = menuText.includes('Rename');
    const hasDeleteOption = menuText.includes('Delete');
    const hasArchiveOption = menuText.includes('Archive');
    
    // Also check for menu items with specific icons or structure
    const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
    const hasMultipleItems = menuItems.length >= 2;
    
    return (hasShareOption || hasRenameOption || hasDeleteOption || hasArchiveOption) && hasMultipleItems;
  }

  async addPinButton(dropdown) {
    // Get the conversation ID for this specific dropdown
    const conversationId = this.getConversationIdFromDropdown(dropdown);
    if (!conversationId) {
      console.log('ChatGPT Pinned: No conversation ID found for dropdown');
      return;
    }

    const existingPin = dropdown.querySelector('.pin-conversation-button');
    if (existingPin) {
      // Update existing button instead of creating a new one
      const isPinned = await this.storageManager.isPinned(conversationId);
      const svg = existingPin.querySelector('svg');
      const span = existingPin.querySelector('span');
      
      if (svg && span) {
        svg.innerHTML = isPinned ? 
          '<path d="M5 12l5 5L20 7"></path>' : 
          '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>';
        span.textContent = isPinned ? 'Unpin Conversation' : 'Pin Conversation';
      }
      return;
    }

    const isPinned = await this.storageManager.isPinned(conversationId);
    
    // Find the first menu item to use as a template
    const firstMenuItem = dropdown.querySelector('[role="menuitem"]');
    if (!firstMenuItem) {
      console.log('ChatGPT Pinned: No menu items found');
      return;
    }

    const pinButton = document.createElement('div');
    pinButton.setAttribute('role', 'menuitem');
    pinButton.className = firstMenuItem.className;
    pinButton.classList.add('pin-conversation-button');
    
    // Copy styles from the first menu item
    const computedStyle = window.getComputedStyle(firstMenuItem);
    pinButton.style.cursor = 'pointer';
    pinButton.style.padding = computedStyle.padding;
    
    pinButton.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isPinned ? 
            '<path d="M5 12l5 5L20 7"></path>' : 
            '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>'
          }
        </svg>
        <span>${isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
      </div>
    `;

    // Add hover effects that match ChatGPT's menu items
    pinButton.addEventListener('mouseenter', () => {
      // Use the same hover style as other menu items
      const computedStyle = window.getComputedStyle(firstMenuItem);
      pinButton.style.backgroundColor = 'var(--surface-hover, rgba(0, 0, 0, 0.05))';
      pinButton.style.transition = 'background-color 0.1s ease';
    });
    
    pinButton.addEventListener('mouseleave', () => {
      pinButton.style.backgroundColor = 'transparent';
    });

    pinButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get current state and calculate new state for this specific conversation
      const currentIsPinned = await this.storageManager.isPinned(conversationId);
      const newIsPinned = !currentIsPinned;
      
      // Update button text immediately for instant feedback
      const svg = pinButton.querySelector('svg');
      const span = pinButton.querySelector('span');
      
      if (svg && span) {
        // Show the new state immediately
        svg.innerHTML = newIsPinned ? 
          '<path d="M5 12l5 5L20 7"></path>' : 
          '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>';
        span.textContent = newIsPinned ? 'Unpin Conversation' : 'Pin Conversation';
      }
      
      // Get the conversation title from the link
      const conversationTitle = this.getConversationTitleFromId(conversationId);
      
      // Perform the actual toggle with the specific conversation ID and title
      await this.togglePinWithDetails(conversationId, conversationTitle);
      
      // Close the dropdown
      const backdrop = document.querySelector('[data-radix-popper-content-wrapper]')?.parentElement;
      if (backdrop) backdrop.click();
    });

    // Insert after the first menu item
    firstMenuItem.parentNode.insertBefore(pinButton, firstMenuItem.nextSibling);
    console.log('ChatGPT Pinned: Added pin button');
  }

  getCurrentConversationId() {
    const url = window.location.pathname;
    const match = url.match(/\/c\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  getConversationIdFromDropdown(dropdown) {
    // Try to find the conversation ID from the dropdown's context
    // Look for the conversation link that triggered this dropdown
    
    // Method 1: Look for a data-testid that might contain the conversation info
    const testIdElement = dropdown.closest('[data-testid*="history-item"]') || 
                         document.querySelector('[data-testid*="history-item"] [aria-expanded="true"]');
    
    if (testIdElement) {
      const testId = testIdElement.getAttribute('data-testid');
      // data-testid format is usually like "history-item-0-options"
      const itemMatch = testId.match(/history-item-(\d+)/);
      if (itemMatch) {
        const itemIndex = parseInt(itemMatch[1]);
        // Find the corresponding conversation link
        const conversationLinks = document.querySelectorAll('a[href*="/c/"]');
        if (conversationLinks[itemIndex]) {
          const href = conversationLinks[itemIndex].getAttribute('href');
          const match = href.match(/\/c\/([a-f0-9-]+)/i);
          if (match) return match[1];
        }
      }
    }
    
    // Method 2: Look for the conversation link near the dropdown
    const nearbyLinks = document.querySelectorAll('a[href*="/c/"]');
    for (const link of nearbyLinks) {
      const button = link.querySelector('[aria-expanded="true"]');
      if (button) {
        const href = link.getAttribute('href');
        const match = href.match(/\/c\/([a-f0-9-]+)/i);
        if (match) return match[1];
      }
    }
    
    // Method 3: Fallback to current conversation ID
    return this.getCurrentConversationId();
  }

  getConversationTitleFromId(conversationId) {
    // Find the conversation link with this ID
    const conversationLink = document.querySelector(`a[href*="/c/${conversationId}"]`);
    if (conversationLink) {
      const titleElement = conversationLink.querySelector('.truncate span');
      if (titleElement) {
        return titleElement.textContent.trim();
      }
    }
    
    // Fallback to current page title if we can't find the specific conversation
    return document.title.replace(' - ChatGPT', '').trim();
  }

  async togglePin(conversationId) {
    const title = document.title.replace(' - ChatGPT', '').trim();
    return this.togglePinWithDetails(conversationId, title);
  }

  async togglePinWithDetails(conversationId, title) {
    const isPinned = await this.storageManager.isPinned(conversationId);
    
    if (isPinned) {
      await this.storageManager.removePinnedConversation(conversationId);
    } else {
      await this.storageManager.addPinnedConversation({
        id: conversationId,
        title: title,
        timestamp: Date.now()
      });
    }
    
    // Update the pinned section
    await this.injectPinnedSection();
    
    // Update indicators in the main chat list
    await this.updatePinnedIndicators();
    
    // Update all visible dropdown buttons to reflect the new state
    await this.refreshAllDropdownButtons();
  }

  async updatePinButtons() {
    const dropdowns = document.querySelectorAll('[role="menu"]');
    for (const dropdown of dropdowns) {
      if (this.isConversationDropdown(dropdown)) {
        await this.addPinButton(dropdown);
      }
    }
  }

  async updateAllPinButtons() {
    // Find all existing pin buttons and update them
    const existingPinButtons = document.querySelectorAll('.pin-conversation-button');
    const conversationId = this.getCurrentConversationId();
    
    if (!conversationId) return;
    
    const isPinned = await this.storageManager.isPinned(conversationId);
    
    existingPinButtons.forEach(button => {
      const svg = button.querySelector('svg');
      const span = button.querySelector('span');
      
      if (svg && span) {
        // Update icon
        svg.innerHTML = isPinned ? 
          '<path d="M5 12l5 5L20 7"></path>' : 
          '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>';
        
        // Update text
        span.textContent = isPinned ? 'Unpin Conversation' : 'Pin Conversation';
      }
    });
  }

  async refreshAllDropdownButtons() {
    // Find all visible dropdown menus and refresh their pin buttons
    const dropdowns = document.querySelectorAll('[role="menu"]');
    
    dropdowns.forEach(async dropdown => {
      if (this.isConversationDropdown(dropdown)) {
        const pinButton = dropdown.querySelector('.pin-conversation-button');
        if (pinButton) {
          // Get the specific conversation ID for this dropdown
          const conversationId = this.getConversationIdFromDropdown(dropdown);
          if (conversationId) {
            const isPinned = await this.storageManager.isPinned(conversationId);
            const svg = pinButton.querySelector('svg');
            const span = pinButton.querySelector('span');
            
            if (svg && span) {
              // Update icon and text to reflect current state for this specific conversation
              svg.innerHTML = isPinned ? 
                '<path d="M5 12l5 5L20 7"></path>' : 
                '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>';
              span.textContent = isPinned ? 'Unpin Conversation' : 'Pin Conversation';
            }
          }
        }
      }
    });
  }

  async updatePinnedIndicators() {
    const pinnedConversations = await this.storageManager.getPinnedConversations();
    const pinnedIds = pinnedConversations.map(conv => conv.id);
    
    // Find all conversation links in the main chat list (excluding pinned section)
    const allConversationLinks = document.querySelectorAll('a[href*="/c/"]:not(#pinned-conversations-section a)');
    
    allConversationLinks.forEach(link => {
      // Skip if this link is inside the pinned conversations section
      if (link.closest('#pinned-conversations-section')) {
        return;
      }
      
      // Extract conversation ID from href
      const href = link.getAttribute('href');
      const match = href.match(/\/c\/([a-f0-9-]+)/i);
      if (!match) return;
      
      const conversationId = match[1];
      const isPinned = pinnedIds.includes(conversationId);
      
      // Remove existing indicator
      const existingIndicator = link.querySelector('.pinned-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      if (isPinned) {
        // Add pinned indicator only to conversations in the main chat list
        const indicator = document.createElement('div');
        indicator.className = 'pinned-indicator';
        indicator.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="pinned-icon">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        `;
        
        // Insert the indicator before the conversation title
        const titleDiv = link.querySelector('.truncate');
        if (titleDiv) {
          titleDiv.insertBefore(indicator, titleDiv.firstChild);
        }
      }
    });
  }

  setupDragAndDrop() {
    const pinnedSection = this.pinnedSection;
    if (!pinnedSection) return;

    pinnedSection.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('pinned-conversation')) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    pinnedSection.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('pinned-conversation')) {
        e.target.classList.remove('dragging');
      }
    });

    pinnedSection.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(pinnedSection, e.clientY);
      if (afterElement == null) {
        pinnedSection.appendChild(this.draggedElement);
      } else {
        pinnedSection.insertBefore(this.draggedElement, afterElement);
      }
    });

    pinnedSection.addEventListener('drop', async (e) => {
      e.preventDefault();
      const conversations = [...pinnedSection.querySelectorAll('.pinned-conversation')];
      const orderedIds = conversations.map(el => el.dataset.conversationId);
      await this.storageManager.updateConversationOrder(orderedIds);
    });

    // Handle pinned conversation clicks (for navigation)
    document.addEventListener('click', async (e) => {
      // Handle unpin button clicks
      if (e.target.closest('.unpin-button')) {
        e.preventDefault();
        e.stopPropagation();
        const button = e.target.closest('.unpin-button');
        const conversationId = button.dataset.conversationId;
        
        // Immediately hide the conversation item for instant feedback
        const conversationElement = button.closest('.pinned-conversation');
        if (conversationElement) {
          conversationElement.style.opacity = '0.5';
          conversationElement.style.pointerEvents = 'none';
        }
        
        await this.togglePin(conversationId);
        return;
      }
      
      // Handle pinned conversation navigation clicks
      if (e.target.closest('.pinned-conversation')) {
        const conversationLink = e.target.closest('.pinned-conversation');
        const conversationUrl = conversationLink.dataset.conversationUrl;
        
        if (conversationUrl) {
          e.preventDefault();
          e.stopPropagation();
          
          // Use ChatGPT's navigation method instead of full page reload
          this.navigateToConversation(conversationUrl);
        }
      }
    });
  }

  navigateToConversation(url) {
    try {
      // Method 1: Try to find and click a real conversation link with the same URL
      const existingLink = document.querySelector(`a[href="${url}"]`);
      if (existingLink && !existingLink.closest('#pinned-conversations-section')) {
        // Found a real ChatGPT conversation link, click it to use their navigation
        existingLink.click();
        console.log('ChatGPT Pinned: Clicked existing link for', url);
        return;
      }
      
      // Method 2: Use history API and trigger navigation events
      if (window.history && window.history.pushState) {
        // Update the URL
        window.history.pushState(null, '', url);
        
        // Trigger the events that ChatGPT's router listens for
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
        
        // Also trigger pushstate event (some SPAs listen for this)
        const pushStateEvent = new Event('pushstate');
        window.dispatchEvent(pushStateEvent);
        
        console.log('ChatGPT Pinned: Navigation via history API to', url);
        return;
      }
      
      // Method 3: Fallback to regular navigation
      window.location.href = url;
    } catch (error) {
      console.error('ChatGPT Pinned: Navigation error, falling back to direct navigation', error);
      window.location.href = url;
    }
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
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes[this.storageManager.STORAGE_KEY]) {
        // Debounce to prevent multiple rapid updates
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.injectPinnedSection();
          this.updatePinnedIndicators();
        }, 100);
      }
    });

    // Re-inject pinned section periodically to handle dynamic content, but less frequently
    setInterval(() => {
      const existingSection = document.getElementById('pinned-conversations-section');
      if (!existingSection) {
        console.log('ChatGPT Pinned: Re-injecting pinned section');
        this.injectPinnedSection();
      } else {
        // Update indicators periodically to catch new conversations
        this.updatePinnedIndicators();
      }
    }, 5000); // Reduced frequency to 5 seconds

    // Watch for sidebar changes with debouncing
    const sidebarObserver = new MutationObserver(() => {
      clearTimeout(this.observerTimeout);
      this.observerTimeout = setTimeout(() => {
        const existingSection = document.getElementById('pinned-conversations-section');
        if (!existingSection) {
          this.injectPinnedSection();
        }
      }, 200);
    });

    // Start observing once sidebar is found
    this.waitForChatInterface().then(sidebar => {
      sidebarObserver.observe(sidebar, {
        childList: true,
        subtree: false // Only watch direct children, not all descendants
      });
    });
  }
}

if (window.location.hostname === 'chat.openai.com' || window.location.hostname === 'chatgpt.com') {
  // Prevent multiple instances
  if (window.chatGPTPinnedConversationsInstance) {
    console.log('ChatGPT Pinned Conversations: Instance already exists');
  } else {
    console.log('ChatGPT Pinned Conversations: Initializing extension');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.chatGPTPinnedConversationsInstance = new ChatGPTPinnedConversations();
      });
    } else {
      // DOM is already ready
      window.chatGPTPinnedConversationsInstance = new ChatGPTPinnedConversations();
    }
  }
}