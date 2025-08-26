// Background script for handling extension icon clicks and other background tasks

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // We'll handle PDF downloads in the content script instead
    // Just acknowledge receipt of the message
    if (request.action === 'downloadPDF') {
        sendResponse({ success: true, message: 'PDF download handled in content script' });
        return true;
    }
});

// When the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    // Only work on YouTube video pages
    if (tab.url.includes('youtube.com/watch')) {
        // Send a message to the content script to show the summary panel
        try {
            chrome.tabs.sendMessage(tab.id, { action: 'showSummaryPanel' }, (response) => {
                // Check for error
                if (chrome.runtime.lastError) {
                    console.log('Error sending message:', chrome.runtime.lastError.message);
                    // Reload the tab to ensure content script is loaded
                    chrome.tabs.reload(tab.id, {}, () => {
                        // Wait for page to reload before trying again
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, { action: 'showSummaryPanel' });
                        }, 2000);
                    });
                    return;
                }
                
                // After showing the panel, trigger summarization
                if (response && response.success) {
                    chrome.tabs.sendMessage(tab.id, { action: 'summarizeVideo' });
                }
            });
        } catch (e) {
            console.error('Error in action.onClicked:', e);
            // Open the message page with an error
            chrome.tabs.create({
                url: 'message.html?error=true'
            });
        }
    } else {
        // If not on a YouTube video page, open a new tab with a message
        chrome.tabs.create({
            url: 'message.html'
        });
    }
});
