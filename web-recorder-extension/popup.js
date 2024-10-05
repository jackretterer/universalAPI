document.addEventListener('DOMContentLoaded', function () {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const endpointInput = document.getElementById('endpoint');

  function updateUI(isRecording) {
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
    status.textContent = isRecording ? 'Recording in progress...' : 'Recording stopped.';
  }

  // function isRecording(shouldRecord) {
  //   startBtn.disabled = shouldRecord;
  //   stopBtn.disabled = !shouldRecord;
  //   status.textContent = shouldRecord
  //     ? 'Recording in progress...'
  //     : 'Recording stopped.';
  // }

    // Check the current recording state when the popup opens
    chrome.runtime.sendMessage({ action: 'getRecordingState' }, (response) => {
      updateUI(response.isRecording);
      if (response.isRecording) {
        chrome.storage.local.get('endpoint', (result) => {
          endpointInput.value = result.endpoint || '';
        });
      }
    });

    startBtn.addEventListener('click', function () {
      const endpoint = endpointInput.value;
      if (!endpoint) {
        status.textContent = 'Please enter an API endpoint.';
        return;
      }
  
      chrome.storage.local.set({ endpoint, isRecording: true }, function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.storage.local.set({ recordingTabId: tabs[0].id });
          chrome.tabs.sendMessage(tabs[0].id, { action: 'startRecording' }, function (response) {
            if (chrome.runtime.lastError) {
              console.error('Error:', chrome.runtime.lastError);
              status.textContent = 'Error: Content script not loaded. Please refresh the page.';
              chrome.storage.local.set({ isRecording: false, recordingTabId: null });
            } else {
              updateUI(true);
            }
          });
        });
      });
    });
  
    stopBtn.addEventListener('click', function () {
      chrome.storage.local.get('recordingTabId', function (result) {
        if (result.recordingTabId) {
          chrome.tabs.sendMessage(result.recordingTabId, { action: 'stopRecording' }, function (response) {
            chrome.storage.local.set({ isRecording: false, recordingTabId: null });
            updateUI(false);
            if (response && response.data) {
              status.textContent = 'Submitting data...';
              chrome.storage.local.get('endpoint', function (items) {
                const endpoint = items.endpoint;
                fetch('http://localhost:8000/uipi/create', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    endpoint: endpoint,
                    workflow: response.data.actions,
                  }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    console.log('Server response:', data);
                    status.textContent = 'Workflow submitted successfully.';
                  })
                  .catch((error) => {
                    console.error('Error submitting workflow:', error);
                    status.textContent = 'Error submitting workflow.';
                  });
              });
            }
          });
        } else {
          status.textContent = 'No active recording found.';
        }
      });
    });
  });