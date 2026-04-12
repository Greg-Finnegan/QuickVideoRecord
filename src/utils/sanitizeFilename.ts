/**
 * Sanitize a string for use as a filename.
 * Strips illegal characters, collapses whitespace, trims to maxLength,
 * and ensures the .webm extension.
 * Returns empty string if nothing usable remains (caller should fall back to default).
 */
export function sanitizeRecordingFilename(raw: string, maxLength = 80): string {
  let name = raw
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return "";

  if (name.length > maxLength) {
    name = name.slice(0, maxLength).trimEnd();
  }

  return name;
}
