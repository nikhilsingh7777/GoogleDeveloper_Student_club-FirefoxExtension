console.log('Background: Script loaded');
chrome.commands.onCommand.addListener((command) => {
  console.log('Background: Command received:', command);
  chrome.storage.local.get(['enabled', 'mode'], (data) => {
    const isEnabled = data.enabled ?? false;
    const currentMode = data.mode || 'off';
    if (command === 'toggle-extension') {
      const newEnabled = !isEnabled;
      chrome.storage.local.set({ enabled: newEnabled });
      sendToActiveTab({ action: 'updateState', state: { enabled: newEnabled } });
    } else if (command === 'toggle-habit-mode' && isEnabled) {
      chrome.storage.local.set({ mode: 'habit' });
      sendToActiveTab({ action: 'updateState', state: { mode: 'habit' } });
    } else if (command === 'toggle-advanced-mode' && isEnabled) {
      chrome.storage.local.set({ mode: 'advanced' });
      sendToActiveTab({ action: 'updateState', state: { mode: 'advanced' } });
    }
  });
});
function sendToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}

