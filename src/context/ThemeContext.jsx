import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("theme") || "system"
  );

  const applyTheme = (mode) => {
    const html = document.documentElement;
    if (mode === "dark") {
      html.classList.add("dark");
    } else if (mode === "light") {
      html.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.toggle("dark", prefersDark);
    }
  };

  const setTheme = (mode) => {
    setThemeState(mode);
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  };

  useEffect(() => {
    // Apply on mount / when theme changes
    applyTheme(theme);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme("system");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
