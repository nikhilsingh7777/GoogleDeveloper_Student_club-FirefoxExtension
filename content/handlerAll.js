
console.log('HandlerAll: Loaded handlerAll.js');

// Global State
let state = { enabled: false, mode: 'off', apiKey: '' };
let activeElement = null;
let customInput = null;
let syncTimeout = null;
let observer = null;
let lastCustomValue = '';
const isWhatsApp = window.location.hostname.includes('whatsapp');

// Update state and trigger relevant mode logic
function updateState(newState) {
  state = { ...state, ...newState };
  console.log('HandlerAll: Updated state:', state);

  if (state.enabled) {
    if (state.mode === 'habit') {
      runHabitMode();
    } else if (state.mode === 'advanced') {
      runAdvancedMode();
    }
  }
}

// habit mode..
function runHabitMode() {
  console.log('HandlerAll: habit Mode injected');

  function renderInputBox() {
    if (document.getElementById('custom-input-box') || !activeElement) return;

    const inputBox = document.createElement('div');
    inputBox.id = 'custom-input-box';
    inputBox.innerHTML = `
      <button id="custom-close-btn">𝐗</button>
      <textarea id="custom-input" placeholder="Type to sync..."></textarea>
      <span id="mode-indicator">Habit Mode</span>
    `;
    document.body.appendChild(inputBox);
    document.body.classList.add('custom-input-active');

    document.getElementById('custom-close-btn').onclick = () => {
      inputBox.remove();
      activeElement = null;
      customInput = null;
      if (observer) observer.disconnect();
      if (syncTimeout) clearTimeout(syncTimeout);
      document.body.classList.remove('custom-input-active');
    };

    customInput = document.getElementById('custom-input');
    customInput.addEventListener('input', handleCustomInput);
    customInput.addEventListener('keydown', handleEnterKey);
    syncState();
    customInput.focus();
    adjustSize(customInput);
    startSyncLoop();
    startObserver();
  }

  function handleCustomInput(e) {
    if (!activeElement || isWhatsApp) return;
    const newValue = e.target.value;
    if (activeElement.isContentEditable) activeElement.textContent = newValue;
    else activeElement.value = newValue;
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    lastCustomValue = newValue;
    adjustSize(customInput);
  }

  function handleEnterKey(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const message = customInput.value.trim();
      if (!message) return;

      let waInput = document.querySelector('[contenteditable="true"][data-tab="10"]');
      if (!waInput) {
        waInput = Array.from(document.querySelectorAll('[contenteditable="true"]'))
          .find(el => el.getAttribute('aria-label')?.toLowerCase().includes('type a message'));
      }
      if (!waInput) return;

      waInput.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const success = document.execCommand('insertText', false, message);
      if (!success || waInput.textContent.trim() !== message) {
        waInput.textContent = message;
      }

      waInput.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: message
      }));

      const fireEnter = () => {
        const down = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' });
        const up = new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' });
        waInput.dispatchEvent(down);
        waInput.dispatchEvent(up);
      };
      fireEnter();
      setTimeout(fireEnter, 100);

      customInput.value = '';
      lastCustomValue = '';
    }
  }

  function adjustSize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    textarea.style.width = '500px';
  }

  function syncState() {
    if (activeElement && customInput) {
      const val = activeElement.value || activeElement.textContent || '';
      if (customInput.value !== val) customInput.value = val;
      adjustSize(customInput);
      lastCustomValue = val;
    }
  }

  function startSyncLoop() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncState();
      if (state.mode === 'habit' && customInput.value !== lastCustomValue) {
        startSyncLoop();
      }
    }, 100);
  }

  function startObserver() {
    if (observer) observer.disconnect();
    if (activeElement?.isContentEditable) {
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
    if (state.mode === 'habit' && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) && !e.target.closest('#custom-input-box')) {
      activeElement = e.target.closest('.copyable-text.selectable-text') || e.target.closest('.copyable-text') || e.target;
      renderInputBox();
    }
  });

  document.addEventListener('focusout', () => {
    if (state.mode !== 'habit') {
      const box = document.getElementById('custom-input-box');
      if (box) box.remove();
      activeElement = null;
      customInput = null;
      if (syncTimeout) clearTimeout(syncTimeout);
      if (observer) observer.disconnect();
      document.body.classList.remove('custom-input-active');
    }
  });
}
//advance..
function runAdvancedMode() {
  console.log('HandlerAll: advanced Mode injected');
  const inputBox = document.createElement('div');
  inputBox.id = 'custom-input-box';
  inputBox.innerHTML = `
    <textarea id="custom-input" placeholder="Ask Gemini (e.g. summarize or css:...)"></textarea>
    <span id="mode-indicator">Advanced Mode</span>
  `;
  document.body.appendChild(inputBox);
  const input = document.getElementById('custom-input');
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = input.value.trim();
      input.disabled = true;
      console.log("workingggggg");
      const result = await processGeminiCommand(command);
      if (command.startsWith('css:')) {
        const style = document.createElement('style');
        style.textContent = result;
        document.head.appendChild(style);
      } else {
        alert('Gemini: ' + result);
      }
      input.disabled = false;
      input.value = '';
    }
  });
}
async function processGeminiCommand(text) {
  const key = state.apiKey;
  if (!key) return 'API key missing.';
  let prompt = '';
  if (text.startsWith('css:')) {
    prompt = 'Generate CSS based on this description: ' + text.replace(/^css:/i, '').trim();
  } else {
    prompt = 'Summarize: ' + text;
  }
      console.log("workingggggg2");
      console.log([{parts:[{text:prompt}]}])
      console.log("key obs"+key);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body:JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
    })
  });
    console.log("key obs"+key);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
}

// INIT
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
    sendResponse({ status: 'ok' });
  }
});
