import { useEffect, useMemo, useState } from "react";

export type AuthTheme = "dark" | "light";

const STORAGE_KEY = "authTheme";

function readStoredTheme(): AuthTheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "dark" || value === "light") return value;
    return null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: AuthTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function useAuthTheme() {
  const [theme, setTheme] = useState<AuthTheme>(() => readStoredTheme() ?? "dark");

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  const toggle = useMemo(
    () => () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    []
  );

  return { theme, setTheme, toggle };
}
