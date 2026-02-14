function Header({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <header className="app-header">
      <div className="app-header-top">
        <div className="help-hover-wrap">
          <button type="button" className="theme-toggle theme-toggle-light" aria-label="How to play">
            <span className="theme-toggle-icon" aria-hidden="true">i</span>
          </button>
          <div className="help-hover-panel" role="tooltip">
            <ul>
              <li>Use the question as your clue.</li>
              <li>Correct guesses fill ranked slots.</li>
              <li>Wrong guesses reduce lives.</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          className={`theme-toggle ${theme === "dark" ? "theme-toggle-dark" : "theme-toggle-light"}`}
          onClick={onToggleTheme}
          aria-label="Toggle light and dark mode"
        >
          <span className="theme-toggle-icon" aria-hidden="true">
            {theme === "dark" ? "🌙" : "☀️"}
          </span>
        </button>
      </div>
      <h1 className="app-title">🏏 Cricket Quiz</h1>
      <p className="app-subtitle">Guess players based on pure stats</p>
    </header>
  );
}

export default Header;
