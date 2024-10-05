chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isRecording: false, recordingTabId: null });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getRecordingState') {
      chrome.storage.local.get(['isRecording', 'recordingTabId'], (result) => {
        sendResponse(result);
      });
      return true;
    }
  });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(['isRecording', 'recordingTabId'], (result) => {
      if (result.isRecording && result.recordingTabId === tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'startRecording' });
      }
    });
  }
});