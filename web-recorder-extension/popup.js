document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('status');
    const endpointInput = document.getElementById('endpoint');
  
    function isRecording(shouldRecord) {
      startBtn.disabled = shouldRecord;
      stopBtn.disabled = !shouldRecord;
      status.textContent = shouldRecord
        ? 'Recording in progress...'
        : 'Recording stopped.';
    }
  
    startBtn.addEventListener('click', function () {
      console.log('Start button clicked');
      const endpoint = endpointInput.value;
      if (!endpoint) {
        console.log('No endpoint provided');
        status.textContent = 'Please enter an API endpoint.';
        return;
      }
      console.log('Endpoint:', endpoint);
      chrome.storage.local.set({ endpoint }, function() {
        console.log('Endpoint saved to storage');
      });
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('Sending startRecording message to tab:', tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startRecording' }, function(response) {
          console.log('Response received:', response);
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            status.textContent = 'Error: ' + chrome.runtime.lastError.message;
          } else {
            console.log('Recording started successfully');
            isRecording(true);
          }
        });
      });
    });
  
    stopBtn.addEventListener('click', function () {
      console.log('Stop button clicked');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('Sending stopRecording message to tab:', tabs[0].id);
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'stopRecording' },
          function (response) {
            console.log('Received response from content script:', response);
            isRecording(false);
            if (response && response.data) {
              status.textContent = 'Submitting data...';
              console.log('Data to be sent:', response.data);
              chrome.storage.local.get('endpoint', function (items) {
                const endpoint = items.endpoint;
                console.log('Sending data to endpoint:', endpoint);
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
          }
        );
      });
    });
  });