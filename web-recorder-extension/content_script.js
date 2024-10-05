console.log('Web Recorder Extension: Content script loaded');

let isRecording = false;
let actions = [];
let recordingStartTime = 0;
let windowSize = { width: 0, height: 0 };
let lastMouseMoveTime = 0;
let lastRecordedUrl = '';
let observer;

function startRecording() {
  if (isRecording) {
    console.log('Recording already in progress');
    return;
  }
  console.log('Starting recording...');
  isRecording = true;
  recordingStartTime = Date.now();
  actions = [];
  windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  addEventListeners();
  attachListenersToIframes();
  observer = new MutationObserver(() => {
    handleNavigation();
  });
  observer.observe(document, { childList: true, subtree: true });
  
  handleNavigation();
}

function stopRecording() {
  console.log('Stopping recording...');
  isRecording = false;
  removeEventListeners();
  if (observer) {
    observer.disconnect();
  }
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
  const target = event.target.closest('a') || event.target;
  const action = {
    type: 'click',
    timestamp: Date.now() - recordingStartTime,
    selector: getSelector(target),
    x: event.clientX,
    y: event.clientY,
  };
  
  if (target.tagName.toLowerCase() === 'a' && target.href) {
    action.href = target.href;
  }
  
  actions.push(action);
  console.log('Click recorded:', action);
  
  setTimeout(handleNavigation, 100);
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
  if (now - lastMouseMoveTime < 50) return;
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
  const currentUrl = window.location.href;
  if (currentUrl !== lastRecordedUrl) {
    console.log('Navigation detected:', currentUrl);
    const action = {
      type: 'navigation',
      timestamp: Date.now() - recordingStartTime,
      url: currentUrl,
      title: document.title,
    };
    actions.push(action);
    lastRecordedUrl = currentUrl;
  }
}

function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.tagName.toLowerCase() === 'a') {
    // For anchor tags, use href attribute if available
    if (element.href) {
      return `a[href="${element.getAttribute('href')}"]`;
    }
    // If no href, try using text content
    if (element.textContent.trim()) {
      return `a:contains("${element.textContent.trim()}")`;
    }
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = Array.from(element.classList)
      .filter(c => !c.startsWith('hover:') && !c.includes(':'))
      .slice(0, 2); // Use up to 2 classes
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // Add attribute selectors for data attributes
  const dataAttrs = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .slice(0, 2); // Use up to 2 data attributes
  dataAttrs.forEach(attr => {
    selector += `[${attr.name}="${attr.value}"]`;
  });
  
  // If the selector is still not unique, add nth-child
  const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
  if (siblings.length > 1) {
    const index = siblings.indexOf(element) + 1;
    selector += `:nth-child(${index})`;
  }
  
  return selector;
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
    startRecording();
    sendResponse({ status: 'Recording started' });
  } else if (request.action === 'stopRecording') {
    console.log('Stopping recording...');
    const data = stopRecording();
    console.log('Recorded data:', data);
    sendResponse({ data });
  }
  return true;
});

// Check if we should start recording immediately (in case of page refresh during recording)
if (document.readyState === 'complete') {
  chrome.storage.local.get('isRecording', (result) => {
    if (result.isRecording) {
      startRecording();
    }
  });
} else {
  window.addEventListener('load', () => {
    chrome.storage.local.get('isRecording', (result) => {
      if (result.isRecording) {
        startRecording();
      }
    });
  });
}

console.log('Content script loaded');

// Add these listeners
window.addEventListener('popstate', handleNavigation);
window.addEventListener('pushState', handleNavigation);
window.addEventListener('replaceState', handleNavigation);

// Intercept history methods
const originalPushState = history.pushState;
history.pushState = function() {
  originalPushState.apply(this, arguments);
  handleNavigation();
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  handleNavigation();
};