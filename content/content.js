let currentInput = null;
let currentMode = 'habit';
let isExtensionEnabled = true;
let isFocusShifted = false;
let focusLock = false;
let focusOutTimeout = null;

function toggleInputBox(show) {
  console.log('toggleInputBox called with show:', show);
  let inputBox = document.getElementById('custom-input-box');
  if (show && !inputBox && document.body) {
    console.log('Creating custom input box');
    inputBox = document.createElement('div');
    inputBox.id = 'custom-input-box';
    inputBox.innerHTML = `
      <style>
        #custom-input-box {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: white;
          border: 1px solid #ccc;
          padding: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        #custom-input {
          min-width: 200px;
          max-width: 80vw;
          min-height: 30px;
          max-height: 300px;
          resize: none;
          overflow-y: auto;
          font-family: Arial, sans-serif;
          font-size: 14px;
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        #mode-indicator {
          margin-left: 10px;
          font-size: 12px;
          color: #555;
        }
      </style>
      <textarea id="custom-input"></textarea>
      <span id="mode-indicator">${currentMode === 'habit' ? 'Habit Mode' : 'Advanced Mode'}</span>
    `;
    document.body.appendChild(inputBox);
    const customInput = document.getElementById('custom-input');
    if (customInput) {
      console.log('Custom input created:', customInput);
      // Auto-resize textarea based on content for both width and height
      const resizeTextarea = () => {
        // Height adjustment
        customInput.style.height = 'auto';
        customInput.style.height = `${Math.min(customInput.scrollHeight, 300)}px`;
        // Width adjustment using canvas to measure text width
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '14px Arial, sans-serif';
        const textWidth = context.measureText(customInput.value || ' ').width + 20; // Add padding
        const minWidth = 200;
        const maxWidth = Math.min(window.innerWidth * 0.8, 800); // 80vw or 800px max
        customInput.style.width = `${Math.max(minWidth, Math.min(textWidth, maxWidth))}px`;
        console.log('Resized textarea: width=', customInput.style.width, 'height=', customInput.style.height);
      };
      customInput.addEventListener('input', () => {
        console.log('Custom input value:', customInput.value);
        if (currentInput) {
          if (currentInput.isContentEditable) {
            currentInput.textContent = customInput.value;
            const range = document.createRange();
            range.selectNodeContents(currentInput);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            setTimeout(() => {
              customInput.focus();
              customInput.selectionStart = customInput.selectionEnd = customInput.value.length;
            }, 0);
          } else {
            currentInput.value = customInput.value;
          }
          console.log('Synced to original input:', currentInput.textContent || currentInput.value);
          currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        resizeTextarea();
      });
      if (currentInput.isContentEditable) {
        currentInput.addEventListener('keydown', (e) => e.stopPropagation(), { capture: true });
        currentInput.addEventListener('keypress', (e) => e.stopPropagation(), { capture: true });
        currentInput.addEventListener('keyup', (e) => e.stopPropagation(), { capture: true });
      }
      focusLock = true;
      isFocusShifted = true;
      customInput.focus();
      customInput.value = currentInput ? (currentInput.textContent || currentInput.value || '') : '';
      console.log('Custom input focused, value set to:', customInput.value);
      // Trigger initial resize
      resizeTextarea();
      if (!customInput.isConnected) {
        console.log('Warning: custom-input not connected to DOM, reattempting');
        document.body.appendChild(inputBox);
      }
      setTimeout(() => {
        focusLock = false;
        isFocusShifted = false;
      }, 100);
    } else {
      console.log('Error: custom-input not found after creation');
    }
  } else if (!show && inputBox && !isFocusShifted && !focusLock) {
    console.log('Removing custom input box');
    setTimeout(() => {
      if (currentInput && currentInput.isContentEditable) {
        currentInput.removeEventListener('keydown', (e) => e.stopPropagation(), { capture: true });
        currentInput.removeEventListener('keypress', (e) => e.stopPropagation(), { capture: true });
        currentInput.removeEventListener('keyup', (e) => e.stopPropagation(), { capture: true });
      }
      inputBox.remove();
      currentInput = null;
    }, 500);
  }
}

function mockLLMCall(input, apiKey, action) {
  console.log('mockLLMCall called with action:', action, 'input:', input);
  if (action === 'summarize') {
    return `Summary: ${input.substring(0, 50)}...`;
  } else if (action === 'css') {
    return 'input:focus, textarea:focus, [contenteditable]:focus { position: relative; top: 100px; }';
  }
  return input;
}

browser.runtime.onMessage.addListener((message) => {
  console.log('Message received:', message);
  if (message.action === 'toggleExtension') {
    isExtensionEnabled = message.enabled;
    console.log('Extension enabled set to:', isExtensionEnabled);
    if (!isExtensionEnabled) {
      toggleInputBox(false);
    }
  } else if (message.action === 'setMode') {
    currentMode = message.mode;
    console.log('Mode set to:', currentMode);
    const modeIndicator = document.getElementById('mode-indicator');
    if (modeIndicator) {
      modeIndicator.textContent = currentMode === 'habit' ? 'Habit Mode' : 'Advanced Mode';
    }
  } else if (message.action === 'summarize') {
    if (currentInput && currentMode === 'advanced') {
      console.log('Summarizing input:', currentInput.textContent || currentInput.value);
      const summary = mockLLMCall(currentInput.textContent || currentInput.value, message.apiKey, 'summarize');
      if (currentInput.isContentEditable) {
        currentInput.textContent = summary;
      } else {
        currentInput.value = summary;
      }
      const customInput = document.getElementById('custom-input');
      if (customInput) {
        customInput.value = summary;
        customInput.style.height = 'auto';
        customInput.style.height = `${Math.min(customInput.scrollHeight, 300)}px`;
        // Width adjustment for summary
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '14px Arial, sans-serif';
        const textWidth = context.measureText(summary || ' ').width + 20;
        const minWidth = 200;
        const maxWidth = Math.min(window.innerWidth * 0.8, 800);
        customInput.style.width = `${Math.max(minWidth, Math.min(textWidth, maxWidth))}px`;
      }
    }
  } else if (message.action === 'applyCSS') {
    if (currentMode === 'advanced') {
      console.log('Applying custom CSS');
      const css = mockLLMCall('', message.apiKey, 'css');
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
});

document.addEventListener('focusin', (e) => {
  console.log('Focusin event on element:', e.target, 'tag:', e.target.tagName, 'contenteditable:', e.target.isContentEditable);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') &&
      !e.target.getAttribute('aria-label')?.includes('Search') &&
      !e.target.getAttribute('role')?.includes('search')) {
    currentInput = e.target;
    console.log('Input detected:', currentInput, 'value:', currentInput.textContent || currentInput.value);
    if (isExtensionEnabled && currentMode === 'habit') {
      console.log('Showing input box in Habit Mode');
      toggleInputBox(true);
    }
  }
});

document.addEventListener('focusout', (e) => {
  console.log('Focusout event on element:', e.target);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') && !focusLock) {
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (relatedTarget.id === 'custom-input' || relatedTarget.closest('#custom-input-box'))) {
      console.log('Focusout ignored: Focus moved to custom input box');
      return;
    }
    if (focusOutTimeout) {
      clearTimeout(focusOutTimeout);
    }
    focusOutTimeout = setTimeout(() => {
      console.log('Hiding input box after debounce');
      toggleInputBox(false);
    }, 300);
  }
});