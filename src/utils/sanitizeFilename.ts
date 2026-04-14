/**
 * Sanitize a string for use as a recording filename.
 * Strips illegal/control characters, collapses whitespace, and trims to maxLength.
 * Returns empty string if nothing usable remains (caller should fall back to default).
 */
export function sanitizeRecordingFilename(raw: string, maxLength = 80): string {
  let name = raw
    .replace(/[\x00-\x1f/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return "";

  if (name.length > maxLength) {
    name = name.slice(0, maxLength).trimEnd();
  }

  return name;
}
