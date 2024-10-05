chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isRecording: false, recordingTabId: null });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getRecordingState') {
      chrome.storage.local.get(['isRecording', 'recordingTabId'], (result) => {
        sendResponse(result);
      });
      return true; // Indicates we will send a response asynchronously
    }
  });