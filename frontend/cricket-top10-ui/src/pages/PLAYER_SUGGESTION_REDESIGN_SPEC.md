# Player Suggestion Redesign Spec

## State Model
- `guess: string`: current input value.
- `suggestions: string[]`: suggestion list returned from API and ranked client-side.
- `selectedSuggestionIndex: number`: keyboard-highlighted suggestion index (`-1` means none).
- `feedback: { tone: "success" | "error" | "warning" | "neutral"; text: string }`: inline status message near input.
- `attempts: { player: string; outcome: "correct" | "incorrect" | "duplicate"; rank?: number }[]`: last 12 user attempts.
- `status: "active" | "won" | "lost"`: round state from API.
- `lives`, `found`, `correctAnswers`, `allAnswers`: gameplay summary.
- `loading`, `initialLoading`, `error`: async request state.

## Wireframe Structure
1. Top utility row: `How to Play` toggle.
2. Question nav row: `Previous` button, `Question X/Y`, `Next` button.
3. Question title block.
4. Progress bar + stats row (`Lives`, `Found`, `Remaining`).
5. Input section:
   - label
   - combobox input
   - suggestion listbox
   - primary `Guess` CTA
   - inline feedback/error surface
6. History section:
   - `Correct Guesses` chips with rank badges
   - `Recent Attempts` with outcome labels
7. End-state section (`won`/`lost`) with answer reveal.
8. Reset area with confirmation step.

## Exact Interaction Rules
- Suggestions:
  - Trigger only when input length >= 2.
  - Debounce by ~180ms.
  - Cache by normalized query string.
  - Rank order: prefix matches first, then substring matches, then alpha.
  - Dedupe suggestion values.
- Keyboard:
  - `ArrowDown/ArrowUp` cycles suggestion highlight.
  - `Enter` selects highlighted suggestion; if none highlighted, submits guess.
  - `Escape` collapses to trimmed text and clears active suggestion selection.
- Submit:
  - Ignore when input is empty, loading, round complete, or no lives.
  - Client-validate max length 50.
  - Duplicate prevention for already-correct guesses before API call.
  - Correct guess: success feedback with rank and add attempt.
  - Incorrect guess: contextual error feedback with guessed name and add attempt.
  - Already guessed: warning feedback and add duplicate attempt.
  - After submit: clear input and suggestions.
- Reset:
  - Always ask for confirmation before reset request.
  - On reset, clear feedback, attempts, selection, cached suggestions.

## Accessibility Contract
- Input uses combobox semantics (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`).
- Suggestion list uses `role="listbox"` and options use `role="option"` with `aria-selected`.
- Feedback and errors use `aria-live="polite"`.
- Focus-visible styling applied to input and buttons.
