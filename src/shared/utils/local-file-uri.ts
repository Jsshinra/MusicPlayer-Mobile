export function localPathToFileUri(localPath: string): string {
  const normalized = localPath.replace(/\\/g, "/");
 
  // Windows: C:/Users/... → file:///C:/Users/...
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }
 
  // Mac/Linux: /home/... → file:///home/...
  return `file://${encodeURI(normalized)}`;
}
