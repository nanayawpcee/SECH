"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminData();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="ad-icon-btn"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      style={{ overflow: "hidden" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, rotate: -45, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 45, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "grid", placeItems: "center" }}
        >
          {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
