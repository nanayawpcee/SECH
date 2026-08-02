"use client";

import { Moon, Sun } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminData();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="admin-icon-btn"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun size={17} strokeWidth={2} />
      ) : (
        <Moon size={17} strokeWidth={2} />
      )}
    </button>
  );
}
