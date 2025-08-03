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
export interface QuizElements {
    loading: HTMLElement;
    quizContent: HTMLElement;
    errorMessage: HTMLElement;
    questionNumber: HTMLElement;
    questionText: HTMLElement;
    answerOptions: HTMLElement;
    resultSection: HTMLElement;
    resultMessage: HTMLElement;
    correctAnswer: HTMLElement;
    fullResponse: HTMLElement;
    newQuestionBtn: HTMLButtonElement;
    nextQuestionBtn: HTMLButtonElement;
    questionsAnswered: HTMLElement;
    correctCount: HTMLElement;
    accuracy: HTMLElement;
}
