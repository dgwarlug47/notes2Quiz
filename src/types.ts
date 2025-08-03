// Type definitions for the quiz application

export interface QuizQuestion {
  category: string;
  difficulty: string;
  context?: string;
  question: string;
  alternatives: string[];
  answer: string;
}

export interface QuizStats {
  questionsAnswered: number;
  correctAnswers: number;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type AnswerLetter = 'A' | 'B' | 'C' | 'D';

export interface SimpleQuizElements {
    questionContainer: HTMLElement;
    questionText: HTMLElement;
    optionsContainer: HTMLElement;
    feedbackContainer: HTMLElement;
    feedbackMessage: HTMLElement;
    nextButton: HTMLButtonElement;
    questionCounter: HTMLElement;
    loadingElement: HTMLElement;
    statsContainer: HTMLElement;
    questionsAttempted: HTMLElement;
    correctAnswers: HTMLElement;
    accuracy: HTMLElement;
    textInputContainer: HTMLElement;
    answerInput: HTMLInputElement;
    submitButton: HTMLButtonElement;
    modeToggle: HTMLButtonElement;
    selfAssessmentContainer: HTMLElement;
    correctButton: HTMLButtonElement;
    incorrectButton: HTMLButtonElement;
}
