
console.log('ModeHandler: Script loaded and running');

let state = {
  enabled: false,
  mode: 'off',
  apiKey: ''
};
let activeElement = null;
let customInput = null;
let syncTimeout = null;
let observer = null;
let lastCustomValue = '';
let isWhatsApp = window.location.hostname.includes('whatsapp');

function updateState(newState) {
  state = { ...state, ...newState };
  console.log('ModeHandler: State updated:', state);
  renderInputBox();
}

function renderInputBox() {
  const existingBox = document.getElementById('custom-input-box');
  if (existingBox || !state.enabled || state.mode !== 'habit' || !activeElement) {
    if (existingBox && customInput) {
      syncState();
      customInput.focus();
      startObserver();
    }
    return;
  }

  const inputBox = document.createElement('div');
  inputBox.id = 'custom-input-box';
  inputBox.innerHTML = `
    <button id="custom-close-btn" title="Close input">𝐗</button>
    <textarea id="custom-input" placeholder="Type to sync with active field..."></textarea>
    <span id="mode-indicator">Habit Mode</span>
  `;

  document.body.appendChild(inputBox);
  document.body.classList.add('custom-input-active');

  document.getElementById('custom-close-btn').addEventListener('click', () => {
    const box = document.getElementById('custom-input-box');
    if (box) box.remove();
    activeElement = null;
    customInput = null;
    if (observer) observer.disconnect();
    if (syncTimeout) clearTimeout(syncTimeout);
    document.body.classList.remove('custom-input-active');
  });

  customInput = document.getElementById('custom-input');
  if (customInput) {
    customInput.addEventListener('input', handleCustomInput);
    customInput.addEventListener('keydown', handleEnterKey);
    syncState();
    customInput.focus();
    adjustSize(customInput);
    startSyncLoop();
    startObserver();
  }
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const message = customInput.value.trim();
    if (!message) {
      console.log('WA Handler: Message is empty, skipping.');
      return;
    }

    let waInput = document.querySelector('[contenteditable="true"][data-tab="10"]');
    if (!waInput) {
      console.warn('WA Handler: Fallback to aria-label selector.');
      waInput = Array.from(document.querySelectorAll('[contenteditable="true"]'))
        .find(el => el.getAttribute('aria-label')?.toLowerCase().includes('type a message'));
    }

    if (!waInput) {
      console.error('WA Handler: WhatsApp input NOT found after all fallbacks.');
      return;
    }

    console.log('WA Handler: Found WhatsApp input field. Injecting message...');
    waInput.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);

    const success = document.execCommand('insertText', false, message);
    console.log('WA Handler: execCommand success?', success);

    if (!success || waInput.textContent.trim() !== message) {
      waInput.textContent = message;
      console.log('WA Handler: Fallback: Set textContent manually.');
    }

    waInput.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: message
    }));

    const dispatchEnter = () => {
      const enterDown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13
      });
      const enterUp = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13
      });
      waInput.dispatchEvent(enterDown);
      waInput.dispatchEvent(enterUp);
      console.log('WA Handler: Enter keydown & keyup dispatched.');
    };

    dispatchEnter();
    setTimeout(dispatchEnter, 100); // Double enter

    customInput.value = '';
    lastCustomValue = '';
  }
}

function handleCustomInput(e) {
  if (!activeElement || isWhatsApp) return;
  const newValue = e.target.value;
  if (activeElement.isContentEditable) {
    activeElement.textContent = newValue;
  } else {
    activeElement.value = newValue;
  }
  activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  adjustSize(customInput);
  lastCustomValue = newValue;
}

function syncState() {
  if (activeElement && customInput) {
    const activeValue = activeElement.value || activeElement.textContent || '';
    if (customInput.value !== activeValue) {
      customInput.value = activeValue;
      adjustSize(customInput);
    }
    lastCustomValue = customInput.value;
  }
}

function adjustSize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  textarea.style.width = '500px';
}

function startSyncLoop() {
  if (syncTimeout) clearTimeout(syncTimeout);
  if (activeElement && customInput) {
    syncTimeout = setTimeout(() => {
      syncState();
      if (state.mode === 'habit' && customInput.value !== lastCustomValue) {
        startSyncLoop();
      }
    }, 100);
  }
}

function startObserver() {
  if (observer) observer.disconnect();
  if (activeElement && activeElement.isContentEditable) {
    observer = new MutationObserver(() => {
      if (customInput && customInput.value !== (activeElement.textContent || '')) {
        customInput.value = activeElement.textContent || '';
        adjustSize(customInput);
      }
    });
    observer.observe(activeElement, { childList: true, characterData: true, subtree: true });
  }
}

document.addEventListener('focusin', (e) => {
  if (state.enabled && state.mode === 'habit' &&
    (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
    !e.target.closest('#custom-input-box')) {
    activeElement = e.target.closest('.copyable-text.selectable-text') ||
                    e.target.closest('.copyable-text') || e.target;
    renderInputBox();
  }
});

document.addEventListener('focusout', () => {
  if (!state.enabled || state.mode !== 'habit') {
    const box = document.getElementById('custom-input-box');
    if (box) box.remove();
    activeElement = null;
    customInput = null;
    if (syncTimeout) clearTimeout(syncTimeout);
    if (observer) observer.disconnect();
    document.body.classList.remove('custom-input-active');
  }
});

chrome.storage.local.get(['enabled', 'mode', 'apiKey'], (result) => {
  updateState({
    enabled: result.enabled || false,
    mode: result.mode || 'off',
    apiKey: result.apiKey || ''
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateState') {
    updateState(message.state);
  }
  sendResponse({ status: 'ok' });
});
