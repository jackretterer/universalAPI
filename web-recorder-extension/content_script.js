console.log('Web Recorder Extension: Content script loaded');

let isRecording = false;
let actions = [];
let recordingStartTime = 0;
let windowSize = { width: 0, height: 0 };
let lastMouseMoveTime = 0; // Declare and initialize the variable

function startRecording() {
  isRecording = true;
  recordingStartTime = Date.now();
  actions = [];
  windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  addEventListeners();
  attachListenersToIframes();
}

function stopRecording() {
  isRecording = false;
  removeEventListeners();
  const data = {
    actions,
    windowSize,
    userAgent: navigator.userAgent,
  };
  return data;
}

function addEventListeners() {
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('mousemove', handleMouseMove, true);
  window.addEventListener('hashchange', handleNavigation, true);
  window.addEventListener('popstate', handleNavigation, true);
  document.addEventListener('DOMContentLoaded', handleNavigation, true);
}

function removeEventListeners() {
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('mousemove', handleMouseMove, true);
  window.removeEventListener('hashchange', handleNavigation, true);
  window.removeEventListener('popstate', handleNavigation, true);
  document.removeEventListener('DOMContentLoaded', handleNavigation, true);
}

function handleClick(event) {
  if (!isRecording) return;
  const target = event.target;
  const action = {
    type: 'click',
    timestamp: Date.now() - recordingStartTime,
    selector: getSelector(target),
  };
  
  // Add href information for anchor tags
  if (target.tagName.toLowerCase() === 'a' && target.href) {
    action.href = target.href;
  }
  
  actions.push(action);
}

function handleInput(event) {
  if (!isRecording) return;
  const target = event.target;
  const action = {
    type: 'input',
    timestamp: Date.now() - recordingStartTime,
    selector: getSelector(target),
    value: target.value,
  };
  actions.push(action);
}

function handleScroll() {
  if (!isRecording) return;
  const action = {
    type: 'scroll',
    timestamp: Date.now() - recordingStartTime,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
  actions.push(action);
}

function handleMouseMove(event) {
  if (!isRecording) return;
  const now = Date.now();
  if (now - lastMouseMoveTime < 50) return; // Debounce interval
  lastMouseMoveTime = now;
  const action = {
    type: 'mousemove',
    timestamp: now - recordingStartTime,
    x: event.clientX,
    y: event.clientY,
  };
  actions.push(action);
}

function handleNavigation() {
  if (!isRecording) return;
  const action = {
    type: 'navigation',
    timestamp: Date.now() - recordingStartTime,
    url: window.location.href,
  };
  actions.push(action);
}

function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  } else {
    const path = [];
    let currentElement= element;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
      let selector = currentElement.nodeName.toLowerCase();
      if (currentElement.className) {
        selector += '.' + Array.from(currentElement.classList).join('.');
      }
      const siblingIndex = Array.from(currentElement.parentNode?.children || []).indexOf(currentElement) + 1;
      selector += `:nth-child(${siblingIndex})`;
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }
    return path.join(' > ');
  }
}

function attachListenersToIframes() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    try {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDocument) {
        iframeDocument.addEventListener('click', handleClick, true);
        // Add other event listeners as needed
      }
    } catch (e) {
      console.warn('Could not access iframe content:', e);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'startRecording') {
    console.log('Starting recording...');
    startRecording();
    sendResponse({ status: 'Recording started' });
  } else if (request.action === 'stopRecording') {
    console.log('Stopping recording...');
    const data = stopRecording();
    sendResponse({ data });
  }
  return true;
});

// Check if we should start recording immediately (in case of page refresh during recording)
chrome.storage.local.get('isRecording', (result) => {
  if (result.isRecording) {
    startRecording();
  }
});

console.log('Content script loaded');