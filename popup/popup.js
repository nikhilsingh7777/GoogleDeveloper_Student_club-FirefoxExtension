

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle');
  const modeRadios = document.getElementsByName('mode');
  const apiKeyInput = document.getElementById('apiKeyInput');

  chrome.storage.local.get(['enabled', 'mode', 'apiKey'], (result) => {
    toggleBtn.textContent = result.enabled ? 'Disable' : 'Enable';
    modeRadios.forEach(radio => radio.checked = radio.value === result.mode);
    apiKeyInput.value = result.apiKey || '';
  });

  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['enabled', 'mode', 'apiKey'], (result) => {
      const newEnabled = !result.enabled;
      chrome.storage.local.set({ 
        enabled: newEnabled, 
        mode: result.mode || 'off', 
        apiKey: result.apiKey || '' 
      }, () => {
        toggleBtn.textContent = newEnabled ? 'Disable' : 'Enable';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updateState', 
            state: { enabled: newEnabled, mode: result.mode || 'off', apiKey: result.apiKey || '' } 
          });
        });
      });
    });
  });

  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        chrome.storage.local.get(['enabled', 'apiKey'], (result) => {
          chrome.storage.local.set({ mode: radio.value }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'updateState', 
                state: { enabled: result.enabled || false, mode: radio.value, apiKey: result.apiKey || '' } 
              });
            });
          });
        });
      }
    });
  });

  apiKeyInput.addEventListener('change', () => {
    chrome.storage.local.set({ apiKey: apiKeyInput.value }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateState', 
          state: { apiKey: apiKeyInput.value } 
        });
      });
    });
  });
});