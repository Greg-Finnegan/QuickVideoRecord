export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatSize = (bytes?: number): string => {
  if (!bytes) return "Unknown";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
