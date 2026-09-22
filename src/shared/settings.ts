import { DEFAULT_SETTINGS, type Settings } from './types';

const STORAGE_KEY = 'jevAuthSettings';

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...value };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export function onSettingsChanged(listener: (settings: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) {
      return;
    }
    const next = changes[STORAGE_KEY].newValue as Partial<Settings> | undefined;
    listener({ ...DEFAULT_SETTINGS, ...next });
  });
}
