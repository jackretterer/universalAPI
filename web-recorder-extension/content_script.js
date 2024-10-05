console.log('Web Recorder Extension: Content script loaded');

let isRecording = false;
let actions = [];
let recordingStartTime = 0;
let windowSize = {};

function startRecording() {
  isRecording = true;
  recordingStartTime = Date.now();
  actions = [];
  windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  addEventListeners();
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
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('hashchange', handleNavigation);
  window.addEventListener('popstate', handleNavigation);
}

function removeEventListeners() {
  document.removeEventListener('click', handleClick);
  document.removeEventListener('input', handleInput);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('hashchange', handleNavigation);
  window.removeEventListener('popstate', handleNavigation);
}

function handleClick(event) {
  if (!isRecording) return;
  const action = {
    type: 'click',
    timestamp: Date.now() - recordingStartTime,
    selector: getSelector(event.target),
  };
  actions.push(action);
}

function handleInput(event) {
  if (!isRecording) return;
  const action = {
    type: 'input',
    timestamp: Date.now() - recordingStartTime,
    selector: getSelector(event.target),
    value: event.target.value,
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
  const action = {
    type: 'mousemove',
    timestamp: Date.now() - recordingStartTime,
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
  } else if (element.className) {
    const classes = element.className.trim().split(/\s+/).join('.');
    return `${element.tagName.toLowerCase()}.${classes}`;
  } else {
    return element.tagName.toLowerCase();
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'startRecording') {
    console.log('Starting recording...');
    startRecording();
    sendResponse({status: 'Recording started'});
  } else if (request.action === 'stopRecording') {
    console.log('Stopping recording...');
    const data = stopRecording();
    sendResponse({ data });
  }
  return true;
});

console.log('Content script loaded');