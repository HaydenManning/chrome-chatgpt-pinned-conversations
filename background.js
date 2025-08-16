chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getConversationData') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = new URL(tabs[0].url);
        const conversationId = extractConversationId(url.pathname);
        
        if (conversationId) {
          sendResponse({ 
            conversationId,
            title: tabs[0].title.replace(' - ChatGPT', '').trim()
          });
        } else {
          sendResponse({ error: 'No conversation ID found' });
        }
      }
    });
    return true;
  }
});

function extractConversationId(pathname) {
  const match = pathname.match(/\/c\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}