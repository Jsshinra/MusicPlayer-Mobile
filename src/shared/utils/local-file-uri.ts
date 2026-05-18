import { Capacitor } from "@capacitor/core";

/**
 * Converts a filesystem path (file:// or raw absolute path) into a URL the
 * Capacitor WebView can fetch.
 *
 * On Android/iOS, the WebView is served from https://localhost and can't load
 * file:// URLs directly. Capacitor.convertFileSrc rewrites them into
 * https://localhost/_capacitor_file_/... so <audio>, <img>, fetch all work.
 *
 * On web (vite dev / desktop reference) Capacitor.convertFileSrc passes through
 * the input unchanged, so we fall back to producing a real file:// URI for the
 * desktop case to keep behaviour consistent.
 */
export function localPathToFileUri(localPath: string): string {
  if (Capacitor.isNativePlatform()) {
    // Already a file:// URI — convertFileSrc handles both raw paths and file URIs.
    return Capacitor.convertFileSrc(localPath);
  }

  const normalized = localPath.replace(/\\/g, "/");

  // Windows: C:/Users/... → file:///C:/Users/...
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }

  // Mac/Linux/anything else: /home/... → file:///home/...
  return `file://${encodeURI(normalized)}`;
}
