import {
  Moon,
  Sun,
} from "lucide-react";
import { motion } from "motion/react";

import { useTheme } from "../../theme/ThemeContext";

export function GlobalThemeToggle() {
  const {
    isDark,
    toggleTheme,
  } = useTheme();

  return (
    <motion.button
      type="button"
      aria-label={
        isDark
          ? "Activar modo claro"
          : "Activar modo oscuro"
      }
      title={
        isDark
          ? "Modo claro"
          : "Modo oscuro"
      }
      onClick={toggleTheme}
      whileHover={{
        y: -2,
        scale: 1.035,
      }}
      whileTap={{
        scale: 0.94,
      }}
      transition={{
        duration: 0.16,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="theme-toggle-global fixed bottom-4 left-4 z-[250] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/78 text-(--text-secondary) shadow-[0_12px_38px_rgba(0,0,0,.12)] backdrop-blur-3xl backdrop-saturate-150 outline-none transition-colors hover:bg-white focus-visible:ring-4 focus-visible:ring-(--accent-soft) sm:bottom-5 sm:left-5"
    >
      <motion.span
        key={
          isDark
            ? "sun"
            : "moon"
        }
        initial={{
          opacity: 0,
          rotate: -18,
          scale: 0.72,
        }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.22,
        }}
      >
        {isDark ? (
          <Sun
            size={17}
            strokeWidth={1.8}
          />
        ) : (
          <Moon
            size={17}
            strokeWidth={1.8}
          />
        )}
      </motion.span>
    </motion.button>
  );
}
