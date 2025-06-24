console.log('Background: Script loaded');

browser.commands.onCommand.addListener((command) => {
  console.log('Background: Command received:', command);
  browser.storage.local.get(['enabled', 'mode']).then((data) => {
    const isEnabled = data.enabled !== undefined ? data.enabled : false;
    const currentMode = data.mode || 'off';
    if (command === 'toggle-extension') {
      const newEnabled = !isEnabled;
      browser.storage.local.set({ enabled: newEnabled });
      console.log('Background: Toggling extension to:', newEnabled);
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]) {
          console.log('Background: Sending toggleExtension to tab:', tabs[0].id, tabs[0].url);
          browser.tabs.sendMessage(tabs[0].id, { action: 'toggleExtension', enabled: newEnabled }).then((response) => {
            console.log('Background: Response from content script:', response);
          }).catch((error) => console.error('Background: Error sending toggleExtension:', error));
        }
      }).catch((error) => console.error('Background: Error querying tabs:', error));
    } else if (command === 'toggle-habit-mode' && isEnabled) {
      browser.storage.local.set({ mode: 'habit' });
      console.log('Background: Setting mode to habit');
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]) {
          console.log('Background: Sending setMode habit to tab:', tabs[0].id, tabs[0].url);
          browser.tabs.sendMessage(tabs[0].id, { action: 'setMode', mode: 'habit' }).then((response) => {
            console.log('Background: Response from content script:', response);
          }).catch((error) => console.error('Background: Error sending setMode:', error));
        }
      }).catch((error) => console.error('Background: Error querying tabs:', error));
    } else if (command === 'toggle-advanced-mode' && isEnabled) {
      browser.storage.local.set({ mode: 'advanced' });
      console.log('Background: Setting mode to advanced');
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]) {
          console.log('Background: Sending setMode advanced to tab:', tabs[0].id, tabs[0].url);
          browser.tabs.sendMessage(tabs[0].id, { action: 'setMode', mode: 'advanced' }).then((response) => {
            console.log('Background: Response from content script:', response);
          }).catch((error) => console.error('Background: Error sending setMode:', error));
        }
      }).catch((error) => console.error('Background: Error querying tabs:', error));
    }
  });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Message received:', message, 'from:', sender.tab ? sender.tab.url : 'unknown');
  if (message.action === 'getApiKey') {
    browser.storage.local.get('apiKey').then((data) => {
      sendResponse({ apiKey: data.apiKey || 'No key set' });
    });
    return true; // Async response
  }
});