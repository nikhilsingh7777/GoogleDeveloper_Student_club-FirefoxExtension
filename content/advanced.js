console.log('Advanced Mode: Script loaded');
import CONFIG from './config.js';
let currentInput = null;
let isFocusShifted = false;
let focusLock = false;
let focusOutTimeout = null;
function toggleInputBox(show) {
  console.log('Advanced Mode: toggleInputBox called with show:', show);
  let inputBox = document.getElementById('custom-input-box');
  if (show && !inputBox && document.body) {
    console.log('Advanced Mode: Creating custom input box');
    inputBox = document.createElement('div');
    inputBox.id = 'custom-input-box';
    inputBox.innerHTML = `
      <textarea id="custom-input" placeholder="Enter prompt (e.g., 'summarize' or 'css: make bold')"></textarea>
      <span id="mode-indicator">Advanced Mode</span>
    `;
    document.body.appendChild(inputBox);
    const customInput = document.getElementById('custom-input');
    if (customInput) {
      console.log('Advanced Mode: Custom input created:', customInput);
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
        console.log('Advanced Mode: Resized textarea: width=', customInput.style.width, 'height=', customInput.style.height);
      };
      customInput.addEventListener('input', () => {
        console.log('Advanced Mode: Custom input value:', customInput.value);
        if (currentInput) {
          if (currentInput.isContentEditable) {
            currentInput.textContent = customInput.value;
          } else {
            currentInput.value = customInput.value;
          }
          currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        resizeTextarea();
      });
      customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          processAdvancedCommand(customInput.value);
        }
      });
      if (currentInput) {
        customInput.value = currentInput.textContent || currentInput.value || '';
        if (currentInput.isContentEditable) {
          currentInput.addEventListener('keydown', (e) => e.stopPropagation(), { capture: true });
          currentInput.addEventListener('keypress', (e) => e.stopPropagation(), { capture: true });
          currentInput.addEventListener('keyup', (e) => e.stopPropagation(), { capture: true });
        }
      }
      focusLock = true;
      isFocusShifted = true;
      customInput.focus();
      resizeTextarea();
      if (!customInput.isConnected) {
        console.log('Advanced Mode: Warning: custom-input not connected, reattempting');
        document.body.appendChild(inputBox);
      }
      setTimeout(() => {
        focusLock = false;
        isFocusShifted = false;
      }, 100);
    } else {
      console.log('Advanced Mode: Error: custom-input not found after creation');
    }
  } else if (!show && inputBox && !isFocusShifted && !focusLock) {
    console.log('Advanced Mode: Removing custom input box');
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


async function processAdvancedCommand(prompt) {
  console.log('Advanced Mode: Processing advanced command:', prompt);
  const customInput = document.getElementById('custom-input');
  if (!customInput) {
    console.log('Advanced Mode: Error: customInput not found');
    return;
  }


  try {
    const { apiKey } = await browser.storage.local.get('apiKey');
    if (!apiKey) {
      customInput.value = 'Error: No API key set. Configure in popup.';
      console.log('Advanced Mode: No API key set');
      return;
    }


    let textToProcess;
    if (prompt.toLowerCase().includes('summarise: make summary of this webpage')) {
      textToProcess = extractWebpageContent();
      console.log('Advanced Mode: Extracted webpage content:', textToProcess.substring(0, 50) + '...');
    } else if (prompt.toLowerCase().includes('summarize')) {
      textToProcess = currentInput ? (currentInput.textContent || currentInput.value || '') : '';
      console.log('Advanced Mode: Using current input:', textToProcess);
    } else if (prompt.toLowerCase().startsWith('css:')) {
      const cssRequest = prompt.split('css:')[1].trim();
      textToProcess = cssRequest;
      console.log('Advanced Mode: CSS request:', cssRequest);
    } else {
      customInput.value = 'Invalid command. Use "summarize", "summarise: make summary of this webpage", or "css: <description>".';
      console.log('Advanced Mode: Invalid command');
      return;
    }


    let response;
    if (prompt.toLowerCase().includes('summarize') || prompt.toLowerCase().includes('summarise')) {
      console.log('Advanced Mode: Calling Gemini API with prompt:', textToProcess);
      response = await callGeminiAPI(apiKey, textToProcess);
      if (currentInput) {
        if (currentInput.isContentEditable) {
          currentInput.textContent = response;
        } else {
          currentInput.value = response;
        }
        customInput.value = response;
        console.log('Advanced Mode: Summary response:', response.substring(0, 50) + '...');
      }
    } else if (prompt.toLowerCase().startsWith('css:')) {
      console.log('Advanced Mode: Calling Gemini API for CSS:', textToProcess);
      response = await callGeminiAPI(apiKey, textToProcess);
      const style = document.createElement('style');
      style.textContent = response;
      document.head.appendChild(style);
      customInput.value = `CSS applied: ${response}`;
      console.log('Advanced Mode: CSS applied:', response);
    }
    resizeTextarea(customInput);
  } catch (error) {
    console.error('Advanced Mode: Error processing command:', error);
    customInput.value = `Error: ${error.message}`;
  }
}


async function callGeminiAPI(apiKey, prompt) {
  console.log('Advanced Mode: Initiating Gemini API call with prompt:', prompt.substring(0, 50) + '...');
  const url = `${CONFIG.api.endpoint}?key=${apiKey}`;
  const headers = { ...CONFIG.api.headers };
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: CONFIG.api.maxTokens, temperature: 0.7 }
  };


  try {
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}


function resizeTextarea(element) {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 300)}px`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = '16px Arial, sans-serif';
  const textWidth = context.measureText(element.value || ' ').width + 40;
  const minWidth = 600;
  const maxWidth = Math.min(window.innerWidth * 0.9, 900);
  element.style.width = `${Math.max(minWidth, Math.min(textWidth, maxWidth))}px`;
  console.log('Advanced Mode: Resized textarea: width=', element.style.width, 'height=', element.style.height);
}


document.addEventListener('focusin', (e) => {
  console.log('Advanced Mode: Focusin event on element:', e.target, 'tag:', e.target.tagName, 'contenteditable:', e.target.isContentEditable);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') &&
      !e.target.getAttribute('aria-label')?.includes('Search') &&
      !e.target.getAttribute('role')?.includes('search')) {
    currentInput = e.target;
    console.log('Advanced Mode: Input detected:', currentInput, 'value:', currentInput.textContent || currentInput.value);
    console.log('Advanced Mode: Showing input box');
    toggleInputBox(true);
  }
});


document.addEventListener('focusout', (e) => {
  console.log('Advanced Mode: Focusout event on element:', e.target);
  if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
      !e.target.closest('#custom-input-box') && !focusLock) {
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (relatedTarget.id === 'custom-input' || relatedTarget.closest('#custom-input-box'))) {
      console.log('Advanced Mode: Focusout ignored: Focus moved to custom input box');
      return;
    }
    if (focusOutTimeout) {
      clearTimeout(focusOutTimeout);
    }
    focusOutTimeout = setTimeout(() => {
      console.log('Advanced Mode: Hiding input box after debounce');
      toggleInputBox(false);
    }, 300);
  }
});
function extractWebpageContent() {
  console.log('Advanced Mode: Extracting webpage content');
  let text = '';
  const elements = document.body.getElementsByTagName('*');
  for (let element of elements) {
    if (element.tagName === 'P' || element.tagName === 'DIV' || element.tagName === 'SPAN') {
      text += element.textContent.trim() + ' ';
    }
  }
  const result = text.length > 0 ? text.substring(0, 1000) : 'No significant content found';
  console.log('Advanced Mode: Extracted content:', result.substring(0, 50) + '...');
  return result;
}
