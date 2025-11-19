// Background service worker for Chrome Window Recorder

console.log('Background service worker loaded');

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    const recorderTabId = message.recorderTabId;

    if (!recorderTabId) {
      console.error('No recorderTabId provided');
      sendResponse({ streamId: null });
      return true;
    }

    console.log('Requesting desktopCapture for recorder tab:', recorderTabId);

    // The second parameter should be undefined or omitted for side panels/popups
    // chooseDesktopMedia will show the picker in the current window
    chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window', 'tab'],
      (streamId) => {
        console.log('DesktopCapture returned streamId:', streamId);
        if (streamId && streamId.length > 0) {
          console.log('Success! Sending streamId back to popup');
          sendResponse({ streamId: streamId, recorderTabId: recorderTabId });
        } else {
          console.log('User cancelled or error occurred');
          sendResponse({ streamId: null });
        }
      }
    );

    return true; // Keep message channel open for async response
  }

  if (message.action === 'downloadVideo') {
    chrome.downloads.download(
      {
        url: message.url,
        filename: message.filename,
        saveAs: true,
      },
      () => {
        chrome.runtime.sendMessage({ action: 'downloadReady' });
      }
    );
  }
});
