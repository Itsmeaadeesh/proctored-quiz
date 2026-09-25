import { Quiz, Question } from '../types';
import quizData from './quizSeedData.json';

export const DEFAULT_QUIZ: Quiz = {
  id: '11111111-1111-1111-1111-111111111111',
  title: quizData.quiz_title || 'RHA DAY 26 Quiz',
  description: 'Official Red Hat Academy Day 26 Examination at Gyan Ganga Institute of Technology & Sciences (GGITS). 60 questions, 60 minutes, single attempt, strictly proctored.',
  duration_minutes: quizData.duration_minutes || 60,
  max_violations: 3,
  shuffle_questions: true,
  allow_backtracking: true,
  is_active: true,
  created_at: new Date().toISOString(),
};

export const DEFAULT_QUESTIONS: Question[] = quizData.questions.map((q, idx) => {
  const hexIndex = (idx + 1).toString(16).padStart(12, '0');
  const questionId = `22222222-2222-2222-2222-${hexIndex}`;
  return {
    id: questionId,
    quiz_id: DEFAULT_QUIZ.id,
    text: q.text.trim(),
    type: 'mcq_single',
    options: q.options,
    correct_answer: q.correct_answer,
    marks: q.marks || 1,
    order_index: idx + 1,
  };
});
