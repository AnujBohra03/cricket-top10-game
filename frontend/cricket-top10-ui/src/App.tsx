import { useEffect, useState } from "react";
import MainLayout from "./layout/MainLayout";
import GamePage from "./pages/GamePage";

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  const stored = window.localStorage.getItem("theme-mode");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme-mode", theme);
  }, [theme]);

  return (
    <MainLayout
      theme={theme}
      onToggleTheme={() => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
      }}
    >
      <GamePage />
    </MainLayout>
  );
}

export default App;
