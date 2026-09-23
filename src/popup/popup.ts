import { DETECTOR } from '../detector/mode';
import { loadSettings, saveSettings } from '../shared/settings';
import { onStatsChanged, readStats } from '../shared/stats';
import type { Settings, SlopStats } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#settings-form');
const apiKeyInput = document.querySelector<HTMLInputElement>('#api-key');
const toggleKey = document.querySelector<HTMLButtonElement>('#toggle-key');
const enabledInput = document.querySelector<HTMLInputElement>('#enabled');
const enabledStatus = document.querySelector<HTMLElement>('#enabled-status');
const saveButton = document.querySelector<HTMLButtonElement>('#save');
const keySection = document.querySelector<HTMLDetailsElement>('#key-section');
const keyBadge = document.querySelector<HTMLElement>('#key-badge');
const formStatus = document.querySelector<HTMLElement>('#form-status');
const modePill = document.querySelector<HTMLElement>('#mode-pill');
const modeNote = document.querySelector<HTMLElement>('#mode-note');
const statChecked = document.querySelector<HTMLElement>('#stat-checked');
const statMarked = document.querySelector<HTMLElement>('#stat-marked');
const statRate = document.querySelector<HTMLElement>('#stat-rate');

let savedSettings: Settings | null = null;

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

function applyMode(): void {
  if (modePill) {
    modePill.dataset.mode = DETECTOR;
    modePill.textContent = DETECTOR === 'mock' ? 'Mock mode' : 'Jev';
  }
  if (modeNote) {
    modeNote.textContent =
      DETECTOR === 'mock'
        ? 'Mock mode: results are random but fixed per post. No TypeSafe calls are made.'
        : 'Posts are checked by TypeSafe Jev.';
  }
}

function applyEnabled(enabled: boolean): void {
  if (enabledInput) {
    enabledInput.checked = enabled;
  }
  if (enabledStatus) {
    enabledStatus.textContent = enabled
      ? 'AI slop posts get a red banner.'
      : 'Off. No posts are checked.';
  }
}

function applySettings(settings: Settings): void {
  savedSettings = settings;
  const hasKey = Boolean(settings.apiKey.trim());
  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }
  applyEnabled(settings.enabled);
  setStatus(keyBadge, hasKey ? 'Saved' : 'Not set', hasKey ? 'ok' : undefined);
  // Jev mode cannot work without a key, so show the field at once.
  if (keySection && DETECTOR === 'jev' && !hasKey) {
    keySection.open = true;
  }
}

function applyStats(stats: SlopStats): void {
  if (statChecked) {
    statChecked.textContent = String(stats.checked);
  }
  if (statMarked) {
    statMarked.textContent = String(stats.marked);
  }
  if (statRate) {
    statRate.textContent =
      stats.checked > 0 ? `${Math.round((stats.marked / stats.checked) * 100)}%` : '–';
  }
}

function readSettings(): Settings {
  return {
    apiKey: apiKeyInput?.value.trim() ?? '',
    enabled: Boolean(enabledInput?.checked),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not save settings.';
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

// The toggle saves at once. It keeps the saved key, not an unsaved draft in the field.
enabledInput?.addEventListener('change', async () => {
  const enabled = enabledInput.checked;
  try {
    const base = savedSettings ?? (await loadSettings());
    const next: Settings = { ...base, enabled };
    await saveSettings(next);
    savedSettings = next;
    applyEnabled(enabled);
    setStatus(formStatus, '');
  } catch (error) {
    applyEnabled(!enabled);
    setStatus(formStatus, errorMessage(error), 'error');
  }
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
    setStatus(formStatus, 'Key saved.', 'ok');
  } catch (error) {
    setStatus(formStatus, errorMessage(error), 'error');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
    }
  }
});

applyMode();
void loadSettings().then(applySettings);
void readStats().then(applyStats);
onStatsChanged(applyStats);
