import { t } from "../i18n";
import { useTheme } from "../lib/theme";
import { Icon } from "../shell/icons";

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  return <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
    <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    {t(theme === "dark" ? "Light theme" : "Dark theme")}
  </button>;
}
