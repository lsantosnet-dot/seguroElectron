import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className={`grid h-9 w-9 place-items-center rounded-lg bg-panel-2 text-muted transition-colors hover:text-accent ${className}`}
      title={isDark ? "Tema claro" : "Tema escuro"}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
