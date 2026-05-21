import { Preferences } from "@capacitor/preferences";
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
 */
export const preferencesStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};
