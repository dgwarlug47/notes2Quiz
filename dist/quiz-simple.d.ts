declare class SimpleQuizApp {
    private questions;
    private currentQuestionIndex;
    private currentQuestion;
    private elements;
    private hasAnswered;
    constructor();
    private initializeElements;
    private loadQuestions;
    private shuffleQuestions;
    private bindEvents;
    private hideLoading;
    private showError;
    private displayCurrentQuestion;
    private createOptions;
    private selectOption;
    private extractCorrectAnswer;
    private showFeedback;
    private getOptionText;
    private goToNextQuestion;
    private showQuizComplete;
}
export { SimpleQuizApp };
