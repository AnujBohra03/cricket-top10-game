import type { Question } from "../../types/game";

interface Props {
  questions: Question[];
  currentQuestionIndex: number;
  questionText: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function QuestionHeader({
  questions,
  currentQuestionIndex,
  questionText,
  canGoPrevious,
  canGoNext,
  loading,
  onPrevious,
  onNext,
}: Props) {
  return (
    <section className="question-section" aria-label="Question navigation">
      {questions.length > 1 && (
        <div className="question-nav">
          <button
            className="nav-btn"
            onClick={onPrevious}
            disabled={!canGoPrevious || loading}
            aria-label="Previous question"
          >
            ←
          </button>
          <span className="question-count">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button
            className="nav-btn"
            onClick={onNext}
            disabled={!canGoNext || loading}
            aria-label="Next question"
          >
            →
          </button>
        </div>
      )}
      <h2 className="question-text">{questionText}</h2>
    </section>
  );
}

export default QuestionHeader;
