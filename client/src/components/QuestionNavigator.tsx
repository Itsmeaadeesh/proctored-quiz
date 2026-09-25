import React from 'react';
import { Flag, ArrowLeft, ArrowRight, Send } from 'lucide-react';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  answers: Record<string, any>;
  questionIds: string[];
  flaggedQuestions: Set<number>;
  allowBacktracking?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  onSelectIndex,
  answers,
  questionIds,
  flaggedQuestions,
  allowBacktracking = true,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting = false,
}) => {
  const answeredCount = questionIds.filter(
    (id) => answers[id] !== undefined && answers[id] !== '' && answers[id]?.length !== 0
  ).length;

  return (
    <div className="bg-white border border-redhat-gray-border rounded-sm shadow-sm p-6">
      
      {/* Overview Stats */}
      <div className="mb-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-redhat-black font-display mb-2">
          Question Palette
        </h4>
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>Answered: <strong>{answeredCount}</strong> / {totalQuestions}</span>
          <span>Flagged: <strong>{flaggedQuestions.size}</strong></span>
        </div>
      </div>

      {/* Grid of Question Pills (60 questions responsive scrollable) */}
      <div className="grid grid-cols-6 gap-1.5 max-h-72 overflow-y-auto pr-1 mb-6">
        {Array.from({ length: totalQuestions }, (_, idx) => {
          const qId = questionIds[idx];
          const hasAnswer =
            answers[qId] !== undefined &&
            answers[qId] !== '' &&
            answers[qId]?.length !== 0;
          const isFlagged = flaggedQuestions.has(idx);
          const isCurrent = currentIndex === idx;
          const isLocked = !allowBacktracking && idx < currentIndex;
          const isDisabled = isLocked;

          let btnClasses =
            'relative h-8 rounded-sm font-mono text-[11px] font-bold transition-all flex items-center justify-center ';

          if (isCurrent) {
            btnClasses += 'ring-2 ring-redhat-black shadow-sm font-black ';
          }

          if (isLocked) {
            btnClasses += hasAnswer
              ? 'bg-red-200 text-red-900 opacity-60 cursor-not-allowed '
              : 'bg-neutral-200 text-neutral-400 opacity-50 cursor-not-allowed ';
          } else if (hasAnswer) {
            btnClasses += 'bg-redhat-red text-white hover:bg-redhat-red-dark cursor-pointer ';
          } else {
            btnClasses += 'bg-redhat-gray-light text-neutral-800 hover:bg-neutral-200 cursor-pointer ';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectIndex(idx)}
              className={btnClasses}
              title={isLocked ? `Question ${idx + 1} is locked (backtracking disabled)` : `Jump to Question ${idx + 1}`}
            >
              {idx + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                  <Flag className="w-2 h-2 fill-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 pt-4 border-t border-redhat-gray-border mb-6">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 bg-redhat-red rounded-xs inline-block" />
          <span>Answered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 bg-redhat-gray-light border border-neutral-300 rounded-xs inline-block" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 bg-amber-500 rounded-xs inline-block" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 border-2 border-redhat-black rounded-xs inline-block" />
          <span>Current</span>
        </div>
        {!allowBacktracking && (
          <div className="col-span-2 flex items-center space-x-1.5 text-neutral-500">
            <span className="w-3 h-3 bg-neutral-300 rounded-xs inline-block" />
            <span>Locked (Past Questions)</span>
          </div>
        )}
      </div>

      {/* Pagination & Submit CTA */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          {allowBacktracking && (
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="flex-1 py-2.5 px-3 border border-redhat-gray-border rounded-sm text-xs font-bold text-redhat-black hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1}
            className="flex-1 py-2.5 px-3 bg-redhat-black text-white hover:bg-neutral-800 rounded-sm text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Finish & Submit Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-redhat-red hover:bg-redhat-red-dark text-white rounded-sm text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2 transition-colors shadow-md mt-4 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Evaluating...' : 'Submit Final Exam'}</span>
        </button>
      </div>

    </div>
  );
};
