document.addEventListener('DOMContentLoaded', () => {
  const enabledCheckbox = document.getElementById('extension-enabled');
  const habitRadio = document.getElementById('habit-mode');
  const advancedRadio = document.getElementById('advanced-mode');
  const advancedSettings = document.getElementById('advanced-settings');
  const apiKeyInput = document.getElementById('api-key');
  const applyCssButton = document.getElementById('apply-css');
  const summarizeButton = document.getElementById('summarize-input');
  browser.storage.local.get(['enabled', 'mode', 'apiKey']).then((data) => {
    enabledCheckbox.checked = data.enabled !== false;
    habitRadio.checked = data.mode !== 'advanced';
    advancedRadio.checked = data.mode === 'advanced';
    apiKeyInput.value = data.apiKey || '';
    advancedSettings.style.display = data.mode === 'advanced' ? 'block' : 'none';
  });

  //some setting..
  enabledCheckbox.addEventListener('change', () => {
    browser.storage.local.set({ enabled: enabledCheckbox.checked });
    browser.runtime.sendMessage({ action: 'toggleExtension', enabled: enabledCheckbox.checked });
  });

  habitRadio.addEventListener('change', () => {
    if (habitRadio.checked) {
      browser.storage.local.set({ mode: 'habit' });
      advancedSettings.style.display = 'none';
      browser.runtime.sendMessage({ action: 'setMode', mode: 'habit' });
    }
  });

  advancedRadio.addEventListener('change', () => {
    if (advancedRadio.checked) {
      browser.storage.local.set({ mode: 'advanced' });
      advancedSettings.style.display = 'block';
      browser.runtime.sendMessage({ action: 'setMode', mode: 'advanced' });
    }
  });

  apiKeyInput.addEventListener('input', () => {
    browser.storage.local.set({ apiKey: apiKeyInput.value });
  });

  applyCssButton.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'applyCustomCss', apiKey: apiKeyInput.value });
  });

  summarizeButton.addEventListener('click', () => {
    browser.runtime.sendMessage({ action: 'summarizeInput', apiKey: apiKeyInput.value });
  });
});