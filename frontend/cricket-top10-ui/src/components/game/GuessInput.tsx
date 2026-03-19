import type { RefObject } from "react";
import type { SuggestionOption } from "../../hooks/useGameSession";

function renderSuggestionLabel(option: string, query: string): React.ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return option;

  const index = option.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (index < 0) return option;

  const before = option.slice(0, index);
  const match = option.slice(index, index + trimmedQuery.length);
  const after = option.slice(index + trimmedQuery.length);

  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  );
}

interface Props {
  inputRef: RefObject<HTMLInputElement | null>;
  guess: string;
  suggestions: SuggestionOption[];
  selectedSuggestionIndex: number;
  loading: boolean;
  isResetting: boolean;
  disabled: boolean;
  found: number;
  onGuessChange: (value: string) => void;
  onMoveSuggestion: (step: number) => void;
  onApplySuggestion: (value: string) => void;
  onSubmitSuggestion: () => void;
  onSubmitGuess: () => void;
}

function GuessInput({
  inputRef,
  guess,
  suggestions,
  selectedSuggestionIndex,
  loading,
  isResetting,
  disabled,
  found,
  onGuessChange,
  onMoveSuggestion,
  onApplySuggestion,
  onSubmitSuggestion,
  onSubmitGuess,
}: Props) {
  return (
    <section className="input-section" aria-label="Guess input">
      <div className={`search-wrap${suggestions.length > 0 ? " search-open" : ""}`}>
        <input
          ref={inputRef}
          id="guess-input"
          name="cricket-guess-input"
          className="search-input"
          type="text"
          value={guess}
          onChange={(e) => { if (e.target.value.length <= 50) onGuessChange(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); onMoveSuggestion(1); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); onMoveSuggestion(-1); return; }
            if (e.key === "Escape") { e.preventDefault(); onGuessChange(guess.trim()); return; }
            if (e.key === "Enter") {
              if (selectedSuggestionIndex >= 0 && suggestions.length > 0) {
                e.preventDefault(); onSubmitSuggestion(); return;
              }
              if (!loading && found < 10) { e.preventDefault(); onSubmitGuess(); }
            }
          }}
          placeholder="Type a player name…"
          disabled={disabled}
          maxLength={50}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
          data-form-type="other"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="suggestions-list"
          aria-autocomplete="list"
          aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
        />

        {suggestions.length > 0 && (
          <ul id="suggestions-list" className="suggestions" role="listbox" aria-label="Player suggestions">
            {suggestions.map((item, i) => (
              <li key={`${item.playerId}-${i}`}>
                <button
                  type="button"
                  id={`suggestion-${i}`}
                  className={`suggestion-item${selectedSuggestionIndex === i ? " suggestion-active" : ""}${item.alreadySelected ? " suggestion-found" : ""}`}
                  onClick={() => onApplySuggestion(item.value)}
                  role="option"
                  aria-selected={selectedSuggestionIndex === i}
                  disabled={item.alreadySelected}
                >
                  <span>{renderSuggestionLabel(item.value, guess)}</span>
                  {item.alreadySelected && <span className="found-badge">Found</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={onSubmitGuess}
        disabled={disabled || !guess.trim()}
      >
        {loading && !isResetting ? "Checking…" : "Guess"}
      </button>
    </section>
  );
}

export default GuessInput;
