import { resolveMode, type DetectorMode } from '../detector';
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
const thresholdInput = document.querySelector<HTMLInputElement>('#threshold');
const thresholdValue = document.querySelector<HTMLElement>('#threshold-value');

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

function applyMode(mode: DetectorMode): void {
  if (modePill) {
    modePill.dataset.mode = mode;
    modePill.textContent = mode === 'mock' ? 'Mock mode' : 'Jev';
  }
  if (modeNote) {
    modeNote.textContent =
      mode === 'mock'
        ? 'No API key — using mock mode. Results are random but fixed per post.'
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

function applyThreshold(threshold: number): void {
  const pct = Math.round(threshold * 100);
  if (thresholdInput) {
    thresholdInput.value = String(pct);
  }
  if (thresholdValue) {
    thresholdValue.textContent = `${pct}%`;
  }
}

function applySettings(settings: Settings): void {
  savedSettings = settings;
  const hasKey = Boolean(settings.apiKey.trim());
  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }
  applyEnabled(settings.enabled);
  applyThreshold(settings.threshold);
  applyMode(resolveMode(settings));
  setStatus(keyBadge, hasKey ? 'Saved' : 'Not set', hasKey ? 'ok' : undefined);
  if (keySection && !hasKey) {
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
  const threshold = thresholdInput ? Number(thresholdInput.value) / 100 : 0.8;
  return {
    apiKey: apiKeyInput?.value.trim() ?? '',
    enabled: Boolean(enabledInput?.checked),
    threshold: Math.max(0.5, Math.min(0.95, threshold)),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not save settings.';
}

// ── Slider live preview ─────────────────────────────────────────────────

thresholdInput?.addEventListener('input', () => {
  const pct = thresholdInput.value;
  if (thresholdValue) {
    thresholdValue.textContent = `${pct}%`;
  }
});

// Save threshold when the user releases the slider (not on every pixel).
thresholdInput?.addEventListener('change', async () => {
  try {
    const base = savedSettings ?? (await loadSettings());
    const threshold = Number(thresholdInput.value) / 100;
    const next: Settings = { ...base, threshold: Math.max(0.5, Math.min(0.95, threshold)) };
    await saveSettings(next);
    savedSettings = next;
    setStatus(formStatus, '');
  } catch (error) {
    setStatus(formStatus, errorMessage(error), 'error');
  }
});

// ── Show/hide key ───────────────────────────────────────────────────────

toggleKey?.addEventListener('click', () => {
  if (!apiKeyInput) {
    return;
  }
  const show = apiKeyInput.type === 'password';
  apiKeyInput.type = show ? 'text' : 'password';
  toggleKey.textContent = show ? 'Hide' : 'Show';
  toggleKey.setAttribute('aria-pressed', String(show));
});

// ── Enabled toggle (saves immediately) ──────────────────────────────────

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

// ── API key form ────────────────────────────────────────────────────────

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

// ── Init ────────────────────────────────────────────────────────────────

void loadSettings().then(applySettings);
void readStats().then(applyStats);
onStatsChanged(applyStats);
