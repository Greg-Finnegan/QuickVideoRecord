/** Returns an emoji indicator for sprint state */
export const getSprintStateLabel = (state: string): string => {
  switch (state) {
    case "active":
      return "\u{1F7E2}";
    case "future":
      return "\u{1F535}";
    case "closed":
      return "\u26AA";
    default:
      return "";
  }
};

/** Parses a comma-separated string into trimmed, non-empty labels */
export const parseLabels = (input: string): string[] => {
  return input
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
};
