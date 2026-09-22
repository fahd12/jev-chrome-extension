import { loadSettings, saveSettings } from '../shared/settings';
import type { Settings } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#settings-form');
const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key');
const toggleKey = document.querySelector<HTMLButtonElement>('#toggle-key');
const enabledInput = document.querySelector<HTMLInputElement>('#enabled');
const checkAiInput = document.querySelector<HTMLInputElement>('#check-ai');
const checkMisinfoInput = document.querySelector<HTMLInputElement>('#check-misinfo');
const saveButton = document.querySelector<HTMLButtonElement>('#save');
const keyStatus = document.querySelector<HTMLElement>('#key-status');
const formStatus = document.querySelector<HTMLElement>('#form-status');

function setStatus(el: HTMLElement | null, message: string, tone?: 'ok' | 'error'): void {
  if (!el) {
    return;
  }
  el.textContent = message;
  if (tone) {
    el.dataset.tone = tone;
  } else {
    delete el.dataset.tone;
  }
}

function applySettings(settings: Settings): void {
  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }
  if (enabledInput) {
    enabledInput.checked = settings.enabled;
  }
  if (checkAiInput) {
    checkAiInput.checked = settings.checkAi;
  }
  if (checkMisinfoInput) {
    checkMisinfoInput.checked = settings.checkMisinfo;
  }
  setStatus(
    keyStatus,
    settings.apiKey.trim()
      ? 'API key saved on this device.'
      : 'No API key yet — analysis badges will ask you to add one.',
    settings.apiKey.trim() ? 'ok' : undefined,
  );
}

function readSettings(): Settings {
  return {
    apiKey: apiKeyInput?.value.trim() ?? '',
    enabled: Boolean(enabledInput?.checked),
    checkAi: Boolean(checkAiInput?.checked),
    checkMisinfo: Boolean(checkMisinfoInput?.checked),
  };
}

toggleKey?.addEventListener('click', () => {
  if (!apiKeyInput) {
    return;
  }
  const show = apiKeyInput.type === 'password';
  apiKeyInput.type = show ? 'text' : 'password';
  toggleKey.textContent = show ? 'Hide' : 'Show';
  toggleKey.setAttribute('aria-pressed', String(show));
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (saveButton) {
    saveButton.disabled = true;
  }
  setStatus(formStatus, 'Saving…');
  try {
    const settings = readSettings();
    await saveSettings(settings);
    applySettings(settings);
    setStatus(formStatus, 'Saved. Reload open social tabs if badges look stale.', 'ok');
  } catch (error) {
    setStatus(
      formStatus,
      error instanceof Error ? error.message : 'Could not save settings.',
      'error',
    );
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }
  }
});

void loadSettings().then(applySettings);
