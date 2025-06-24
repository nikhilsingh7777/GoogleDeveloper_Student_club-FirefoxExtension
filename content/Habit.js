console.log('Habit Mode: Script loaded');
let currentInput = null;
let isFocusShifted = false;
let focusLock = false;
let focusOutTimeout = null;
function toggleInputBox(show) {
  console.log('Habit Mode: toggleInputBox called with show:', show);
  let inputBox = document.getElementById('custom-input-box');
  if (show && !inputBox && document.body) {
    console.log('Habit Mode: Creating custom input box');
    inputBox = document.createElement('div');
    inputBox.id = 'custom-input-box';
    inputBox.innerHTML = `
      <textarea id="custom-input"></textarea>
      <span id="mode-indicator">Habit Mode</span>
    `;
    document.body.appendChild(inputBox);
    const customInput = document.getElementById('custom-input');
    if (customInput) {
      console.log('Habit Mode: Custom input created:', customInput);
      const resizeTextarea = () => {
        customInput.style.height = 'auto';
        customInput.style.height = `${Math.min(customInput.scrollHeight, 300)}px`;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '16px Arial, sans-serif';
        const textWidth = context.measureText(customInput.value || ' ').width + 40;
        const minWidth = 600;
        const maxWidth = Math.min(window.innerWidth * 0.9, 900);
        customInput.style.width = `${Math.max(minWidth, Math.min(textWidth, maxWidth))}px`;
        console.log('Habit Mode: Resized textarea: width=', customInput.style.width, 'height=', customInput.style.height);
      };
      customInput.addEventListener('input', () => {
        console.log('Habit Mode: Custom input value:', customInput.value);
        if (currentInput) {
          if (currentInput.isContentEditable) {
            currentInput.textContent = customInput.value;
          } else {
            currentInput.value = customInput.value;
          }
          console.log('Habit Mode: Synced to original input:', currentInput.textContent || currentInput.value);
          currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        resizeTextarea();
      });
      focusLock = true;
      isFocusShifted = true;
      customInput.focus();
      customInput.value = currentInput ? (currentInput.textContent || currentInput.value || '') : '';
      console.log('Habit Mode: Custom input focused, value set to:', customInput.value);
      resizeTextarea();
      if (!customInput.isConnected) {
        console.log('Habit Mode: Warning: custom-input not connected, reattempting');
        document.body.appendChild(inputBox);
      }
      setTimeout(() => {
        focusLock = false;
        isFocusShifted = false;
      }, 100);
    } else {
      console.log('Habit Mode: Error: custom-input not found after creation');
    }
  } else if (!show && inputBox && !isFocusShifted && !focusLock) {
    console.log('Habit Mode: Removing custom input box');
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
  console.log('Habit Mode: mockLLMCall called with action:', action, 'input:', input);
  if (action === 'summarize') {
    return `Summary: ${input.substring(0, 50)}...`;
  } else if (action === 'css') {
    return 'input:focus, textarea:focus, [contenteditable]:focus { position: relative; top: 100px; }';
  }
  return input;
}


browser.runtime.onMessage.addListener((message) => {
  console.log('Habit Mode: Message received:', message);
  if (message.action === 'summarize' || message.action === 'applyCSS') {
    if (currentInput) {
      if (message.action === 'summarize') {
        console.log('Habit Mode: Summarizing input:', currentInput.textContent || currentInput.value);
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
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          context.font = '16px Arial, sans-serif';
          const textWidth = context.measureText(summary || ' ').width + 40;
          const minWidth = 600;
          const maxWidth = Math.min(window.innerWidth * 0.9, 900);
          customInput.style.width = `${Math.max(minWidth, Math.min(textWidth, maxWidth))}px`;
          console.log('Habit Mode: Summary applied to custom input');
        }
      } else if (message.action === 'applyCSS') {
        console.log('Habit Mode: Applying custom CSS');
        const css = mockLLMCall('', message.apiKey, 'css');
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      }
    }
  }
});


document.addEventListener('focusin', (e) => {
  console.log('Habit Mode: Focusin event on element:', e.target, 'tag:', e.target.tagName, 'contenteditable:', e.target.isContentEditable);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') &&
      !e.target.getAttribute('aria-label')?.includes('Search') &&
      !e.target.getAttribute('role')?.includes('search')) {
    currentInput = e.target;
    console.log('Habit Mode: Input detected:', currentInput, 'value:', currentInput.textContent || currentInput.value);
    console.log('Habit Mode: Showing input box');
    toggleInputBox(true);
  }
});


document.addEventListener('focusout', (e) => {
  console.log('Habit Mode: Focusout event on element:', e.target);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') && !focusLock) {
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (relatedTarget.id === 'custom-input' || relatedTarget.closest('#custom-input-box'))) {
      console.log('Habit Mode: Focusout ignored: Focus moved to custom input box');
      return;
    }
    if (focusOutTimeout) {
      clearTimeout(focusOutTimeout);
    }
    focusOutTimeout = setTimeout(() => {
      console.log('Habit Mode: Hiding input box after debounce');
      toggleInputBox(false);
    }, 300);
  }
});
