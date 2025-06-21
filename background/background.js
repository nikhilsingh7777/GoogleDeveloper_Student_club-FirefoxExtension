browser.commands.addEventListener('command', (command) => {
  console.log('Command received:', command); // Debug
  if (command === 'toggle-extension') {
    browser.storage.local.get('enabled').then((data) => {
      const newEnabled = data.enabled === undefined ? false : !data.enabled;
      browser.storage.local.set({ enabled: newEnabled });
      browser.runtime.sendMessage({ action: 'toggleExtension', enabled: newEnabled });
    });
  } else if (command === 'toggle-habit-mode') {
    browser.storage.local.set({ mode: 'habit' });
    browser.runtime.sendMessage({ action: 'setMode', mode: 'habit' });
  } else if (command === 'toggle-advanced-mode') {
    browser.storage.local.set({ mode: 'advanced' });
    browser.runtime.sendMessage({ action: 'setMode', mode: 'advanced' });
  }
});