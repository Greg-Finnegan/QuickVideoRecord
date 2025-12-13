import { useState, useEffect } from "react";
import { themeManager, ThemeOption } from "../utils/themeManager";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();

    // Listen for storage changes
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.themePreference) {
        setTheme(changes.themePreference.newValue as ThemeOption);
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  const loadTheme = async () => {
    setLoading(true);
    const currentTheme = await themeManager.getThemePreference();
    setTheme(currentTheme);
    setLoading(false);
  };

  const updateTheme = async (newTheme: ThemeOption) => {
    await themeManager.setThemePreference(newTheme);
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme: updateTheme,
    loading,
  };
};
