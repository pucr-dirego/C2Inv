import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppTheme =
  | "light"
  | "dark";

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (
    theme: AppTheme,
  ) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY =
  "inventarios-ti-theme";

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null,
  );

function readInitialTheme(): AppTheme {
  if (
    typeof window ===
    "undefined"
  ) {
    return "light";
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY,
    );

  return saved === "dark"
    ? "dark"
    : "light";
}

function applyTheme(
  theme: AppTheme,
) {
  const root =
    document.documentElement;

  root.dataset.theme = theme;
  root.classList.toggle(
    "dark",
    theme === "dark",
  );

  root.style.colorScheme =
    theme;
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<AppTheme>(
      readInitialTheme,
    );

  useEffect(() => {
    applyTheme(theme);

    window.localStorage.setItem(
      STORAGE_KEY,
      theme,
    );
  }, [theme]);

  const value =
    useMemo<ThemeContextValue>(
      () => ({
        theme,
        isDark:
          theme === "dark",
        setTheme: (
          nextTheme,
        ) => {
          setThemeState(
            nextTheme,
          );
        },
        toggleTheme: () => {
          setThemeState(
            (current) =>
              current ===
              "dark"
                ? "light"
                : "dark",
          );
        },
      }),
      [theme],
    );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe usarse dentro de ThemeProvider.",
    );
  }

  return context;
}
