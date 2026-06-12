import { Preferences } from "@capacitor/preferences";
import { App as CapacitorApp } from "@capacitor/app";
import type { StateStorage } from "zustand/middleware";

/**
 * Async storage adapter that backs Zustand's persist middleware with
 * @capacitor/preferences.
 *
 * On Android the plugin uses native SharedPreferences, which survives memory
 * pressure (unlike WebView localStorage, which Android can wipe when killing
 * cached processes). On the web / desktop dev server the plugin falls back to
 * localStorage automatically.
 *
 * Zustand's persist middleware natively supports Promise-returning storages,
 * so the only practical consequence is that the store starts unhydrated and
 * components must wait for `useAppStore.persist.hasHydrated()` before relying
 * on persisted state.
 *
 * ── Why setItem is debounced ──────────────────────────────────────────────
 * persist does no diffing: it re-serializes the whole partialized state and
 * calls setItem on EVERY store set(). Bursty interactions (dragging the volume
 * slider, rapid queue edits) can fire many sets in a few hundred ms, each one
 * a full JSON.stringify + native SharedPreferences write. We coalesce writes
 * per key with a trailing debounce so only the LAST value in a burst is
 * actually persisted. To avoid losing state if Android kills the process, we
 * flush everything pending immediately when the app goes to background.
 */

const DEBOUNCE_MS = 1000;

interface PendingWrite {
  value: string;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingWrite>();

function flushKey(name: string): void {
  const entry = pending.get(name);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(name);
  void Preferences.set({ key: name, value: entry.value });
}

function flushAll(): void {
  for (const name of Array.from(pending.keys())) {
    flushKey(name);
  }
}

// Flush immediately on background so we never lose the latest state if Android
// reclaims the process while a debounced write is still pending. Registered
// once at module load.
void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
  if (!isActive) flushAll();
});

export const preferencesStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: (name: string, value: string): void => {
    const existing = pending.get(name);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      pending.delete(name);
      void Preferences.set({ key: name, value });
    }, DEBOUNCE_MS);
    pending.set(name, { value, timer });
  },
  removeItem: async (name: string): Promise<void> => {
    const existing = pending.get(name);
    if (existing) {
      clearTimeout(existing.timer);
      pending.delete(name);
    }
    await Preferences.remove({ key: name });
  },
};
