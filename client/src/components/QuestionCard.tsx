import React from 'react';
import { Question } from '../types/quiz';
import { Flag, CheckCircle, RotateCcw } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: string | string[] | undefined;
  onSelectAnswer: (answer: string | string[]) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  isFlagged,
  onToggleFlag,
}) => {
  const isMultiple = question.type === 'mcq_multiple';
  const isShortAnswer = question.type === 'short_answer';

  const handleOptionClick = (option: string) => {
    if (isMultiple) {
      const currentArr = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
      if (currentArr.includes(option)) {
        onSelectAnswer(currentArr.filter((item) => item !== option));
      } else {
        onSelectAnswer([...currentArr, option]);
      }
    } else {
      onSelectAnswer(option);
    }
  };

  const isOptionSelected = (option: string) => {
    if (isMultiple) {
      return Array.isArray(selectedAnswer) && selectedAnswer.includes(option);
    }
    return selectedAnswer === option;
  };

  return (
    <div className="bg-white border border-redhat-gray-border rounded-sm shadow-sm p-6 sm:p-8 relative">
      
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-redhat-gray-border">
        
        <div className="flex items-center space-x-3">
          <span className="bg-redhat-black text-white font-mono font-bold text-xs px-2.5 py-1 rounded-xs uppercase tracking-wider">
            Q {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold text-redhat-gray-text">
            {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
          </span>
          <span className="text-xs px-2 py-0.5 bg-redhat-gray-light text-redhat-gray-dark rounded-xs font-mono uppercase">
            {isShortAnswer
              ? 'Short Answer'
              : isMultiple
              ? 'Multi-Choice'
              : 'Single Choice'}
          </span>
        </div>

        {/* Flag for Review Button (Red-outlined per branding) */}
        <button
          type="button"
          onClick={onToggleFlag}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all border ${
            isFlagged
              ? 'bg-red-50 border-redhat-red text-redhat-red shadow-xs'
              : 'border-redhat-red text-redhat-red hover:bg-red-50/50'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-redhat-red' : ''}`} />
          <span>{isFlagged ? 'Flagged for Review' : 'Flag for Review'}</span>
        </button>

      </div>

      {/* Question Text */}
      <div className="text-lg sm:text-xl font-bold text-redhat-black mb-8 leading-snug">
        {question.text}
      </div>

      {/* Question Options or Input */}
      {isShortAnswer ? (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Enter your exact answer:
          </label>
          <input
            type="text"
            value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
            onChange={(e) => onSelectAnswer(e.target.value)}
            placeholder="Type command or term here..."
            className="w-full px-4 py-3 border border-redhat-gray-border rounded-sm text-base text-redhat-black focus:outline-hidden focus:border-l-4 focus:border-l-redhat-red focus:border-redhat-gray-dark transition-all bg-white font-mono"
            autoComplete="off"
            spellCheck="false"
          />
          <p className="text-xs text-neutral-500">
            Case-insensitive exact match evaluation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {question.options?.map((option, idx) => {
            const selected = isOptionSelected(option);
            const letter = String.fromCharCode(65 + idx);

            return (
              <div
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={`flex items-center p-4 border rounded-sm cursor-pointer transition-all duration-150 ${
                  selected
                    ? 'border-redhat-red bg-red-50/40 shadow-xs'
                    : 'border-redhat-gray-border bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
                }`}
              >
                {/* Option Letter Pill */}
                <div
                  className={`w-7 h-7 rounded-xs flex items-center justify-center font-bold text-xs font-mono mr-4 transition-colors ${
                    selected
                      ? 'bg-redhat-red text-white'
                      : 'bg-redhat-gray-light text-neutral-700'
                  }`}
                >
                  {letter}
                </div>

                {/* Option Text */}
                <span className="text-base text-redhat-black font-medium flex-1">
                  {option}
                </span>

                {/* Selection Tick */}
                {selected && (
                  <CheckCircle className="w-5 h-5 text-redhat-red ml-2 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Answer Button */}
      {selectedAnswer !== undefined && selectedAnswer !== '' && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSelectAnswer(isMultiple ? [] : '')}
            className="inline-flex items-center space-x-1 text-xs text-redhat-gray-text hover:text-redhat-red transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear selection</span>
          </button>
        </div>
      )}

    </div>
  );
};
