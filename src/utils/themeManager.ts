export type ThemeOption = "light" | "dark" | "system";
export type AppliedTheme = "light" | "dark";

class ThemeManager {
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  }

  /**
   * Get the current theme preference from storage
   */
  async getThemePreference(): Promise<ThemeOption> {
    try {
      const result = await chrome.storage.local.get("themePreference");
      return (result.themePreference as ThemeOption) || "system";
    } catch (error) {
      console.error("Failed to get theme preference:", error);
      return "system";
    }
  }

  /**
   * Set the theme preference in storage
   */
  async setThemePreference(theme: ThemeOption): Promise<void> {
    try {
      console.log('Setting theme preference:', theme);
      await chrome.storage.local.set({ themePreference: theme });
      console.log('Theme preference saved to storage');
      this.applyTheme(theme);
    } catch (error) {
      console.error("Failed to set theme preference:", error);
    }
  }

  /**
   * Get the actual theme to apply based on preference
   */
  getAppliedTheme(preference: ThemeOption): AppliedTheme {
    if (preference === "system") {
      return this.mediaQuery.matches ? "dark" : "light";
    }
    return preference;
  }

  /**
   * Apply the theme to the document
   */
  applyTheme(preference: ThemeOption): void {
    const appliedTheme = this.getAppliedTheme(preference);

    console.log('Applying theme:', { preference, appliedTheme });

    if (appliedTheme === "dark") {
      document.documentElement.classList.add("dark");
      console.log('Added dark class to html element');
    } else {
      document.documentElement.classList.remove("dark");
      console.log('Removed dark class from html element');
    }

    console.log('Current html classes:', document.documentElement.className);
  }

  /**
   * Initialize theme on page load
   */
  async initialize(): Promise<void> {
    const preference = await this.getThemePreference();
    this.applyTheme(preference);

    // Listen for system theme changes
    this.mediaQuery.addEventListener("change", async () => {
      const currentPreference = await this.getThemePreference();
      if (currentPreference === "system") {
        this.applyTheme("system");
      }
    });

    // Listen for storage changes (for sync across pages)
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes.themePreference) {
        this.applyTheme(changes.themePreference.newValue);
      }
    });
  }
}

export const themeManager = new ThemeManager();
