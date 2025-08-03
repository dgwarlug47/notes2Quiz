// Type definitions
interface QuizQuestion {
    category: string;
    difficulty: string;
    context?: string;
    question: string;
    alternatives: string[];
    answer: string;
}

type AnswerLetter = 'A' | 'B' | 'C' | 'D';

interface SimpleQuizElements {
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
}

class SimpleQuizApp {
    private questions: QuizQuestion[] = [];
    private currentQuestionIndex: number = 0;
    private currentQuestion: QuizQuestion | null = null;
    private elements: SimpleQuizElements;
    private hasAnswered: boolean = false;
    private questionsAttempted: number = 0;
    private correctCount: number = 0;

    constructor() {
        this.elements = this.initializeElements();
        this.loadQuestions();
        this.bindEvents();
    }

    private initializeElements(): SimpleQuizElements {
        const getElement = (id: string): HTMLElement => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Element with id "${id}" not found`);
            }
            return element;
        };

        const getButton = (id: string): HTMLButtonElement => {
            const element = document.getElementById(id) as HTMLButtonElement;
            if (!element) {
                throw new Error(`Button with id "${id}" not found`);
            }
            return element;
        };

        return {
            questionContainer: getElement('question-container'),
            questionText: getElement('question-text'),
            optionsContainer: getElement('options-container'),
            feedbackContainer: getElement('feedback-container'),
            feedbackMessage: getElement('feedback-message'),
            nextButton: getButton('next-button'),
            questionCounter: getElement('question-counter'),
            loadingElement: getElement('loading'),
            statsContainer: getElement('stats-container'),
            questionsAttempted: getElement('questions-attempted'),
            correctAnswers: getElement('correct-answers'),
            accuracy: getElement('accuracy')
        };
    }

    private async loadQuestions(): Promise<void> {
        try {
            const response = await fetch('quiz_questions.json');
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.statusText}`);
            }
            this.questions = await response.json() as QuizQuestion[];
            this.shuffleQuestions();
            this.hideLoading();
            this.displayCurrentQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load quiz questions. Please refresh the page.');
        }
    }

    private shuffleQuestions(): void {
        // Fisher-Yates shuffle algorithm
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    private bindEvents(): void {
        this.elements.nextButton.addEventListener('click', () => {
            this.goToNextQuestion();
        });
    }

    private hideLoading(): void {
        this.elements.loadingElement.style.display = 'none';
        this.elements.questionContainer.style.display = 'block';
    }

    private showError(message: string): void {
        this.elements.loadingElement.innerHTML = `
            <div class="error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    private displayCurrentQuestion(): void {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showQuizComplete();
            return;
        }

        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.hasAnswered = false;

        // Update question counter
        this.elements.questionCounter.textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;

        // Display question
        this.elements.questionText.innerHTML = `
            <div class="question-category">${this.currentQuestion.category} - ${this.currentQuestion.difficulty}</div>
            <div class="question-content">${this.currentQuestion.question}</div>
        `;

        // Clear and create options
        this.elements.optionsContainer.innerHTML = '';
        this.createOptions();

        // Hide feedback and next button
        this.elements.feedbackContainer.style.display = 'none';
        this.elements.nextButton.style.display = 'none';
    }

    private createOptions(): void {
        if (!this.currentQuestion) return;

        const letters: AnswerLetter[] = ['A', 'B', 'C', 'D'];
        
        this.currentQuestion.alternatives.forEach((alternative: string, index: number) => {
            const letter = letters[index];
            const optionElement = document.createElement('button');
            optionElement.className = 'option-button';
            optionElement.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${alternative}</span>
            `;

            optionElement.addEventListener('click', () => {
                if (!this.hasAnswered) {
                    this.selectOption(letter, optionElement);
                }
            });

            this.elements.optionsContainer.appendChild(optionElement);
        });
    }

    private selectOption(selectedLetter: AnswerLetter, selectedElement: HTMLButtonElement): void {
        if (this.hasAnswered || !this.currentQuestion) return;

        this.hasAnswered = true;
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion.answer);
        const isCorrect = selectedLetter === correctLetter;

        // Update statistics
        this.questionsAttempted++;
        if (isCorrect) {
            this.correctCount++;
        }
        this.updateStatistics();

        // Disable all options and highlight correct/incorrect
        const allOptions = this.elements.optionsContainer.querySelectorAll('.option-button');
        allOptions.forEach((option: Element) => {
            const optionElement = option as HTMLButtonElement;
            optionElement.disabled = true;
            
            const letterElement = optionElement.querySelector('.option-letter');
            if (!letterElement) return;
            
            const optionLetter = letterElement.textContent as AnswerLetter;
            
            if (optionLetter === correctLetter) {
                optionElement.classList.add('correct');
            } else if (optionLetter === selectedLetter && !isCorrect) {
                optionElement.classList.add('incorrect');
            } else {
                optionElement.classList.add('disabled');
            }
        });

        // Show feedback
        this.showFeedback(isCorrect, selectedLetter, correctLetter);
    }

    private extractCorrectAnswer(answerText: string): AnswerLetter {
        if (!this.currentQuestion) return 'A';
        
        const letters: AnswerLetter[] = ['A', 'B', 'C', 'D'];
        
        // Compare the answer text with each alternative to find the matching index
        for (let i = 0; i < this.currentQuestion.alternatives.length; i++) {
            const alternative = this.currentQuestion.alternatives[i];
            
            // Direct text comparison (case insensitive, trimmed)
            if (alternative.toLowerCase().trim() === answerText.toLowerCase().trim()) {
                return letters[i];
            }
            
        }
        
        // Debug: throw error if no match found to identify issues
        console.error('No matching alternative found for answer:', answerText);
        console.error('Available alternatives:', this.currentQuestion.alternatives);
        throw new Error(`Could not find matching alternative for answer: "${answerText}"`);
        
        return 'A'; // Default fallback
    }

    private showFeedback(isCorrect: boolean, selectedLetter: AnswerLetter, correctLetter: AnswerLetter): void {
        const correctOptionText = this.getOptionText(correctLetter);
        
        if (isCorrect) {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-correct">
                    <h3>🎉 Correct!</h3>
                    <p>Well done! You selected the right answer: <strong>${correctLetter}) ${correctOptionText}</strong></p>
                </div>
            `;
        } else {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-incorrect">
                    <h3>❌ Incorrect</h3>
                    <p>You selected: <strong>${selectedLetter})</strong></p>
                    <p>The correct answer is: <strong>${correctLetter}) ${correctOptionText}</strong></p>
                </div>
            `;
        }

        // Show statistics summary
        const accuracy = this.questionsAttempted > 0 
            ? Math.round((this.correctCount / this.questionsAttempted) * 100)
            : 0;
        
        this.elements.feedbackMessage.innerHTML += `
            <div class="stats-summary">
                <p><strong>📊 Your Progress:</strong> ${this.correctCount}/${this.questionsAttempted} correct (${accuracy}%)</p>
            </div>
        `;

        this.elements.feedbackContainer.style.display = 'block';
        this.elements.nextButton.style.display = 'block';
    }

    private getOptionText(letter: AnswerLetter): string {
        if (!this.currentQuestion) return '';
        
        const letterToIndex: Record<AnswerLetter, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const index = letterToIndex[letter];
        
        return this.currentQuestion.alternatives[index] || '';
    }

    private updateStatistics(): void {
        this.elements.questionsAttempted.textContent = this.questionsAttempted.toString();
        this.elements.correctAnswers.textContent = this.correctCount.toString();
        
        const accuracy = this.questionsAttempted > 0 
            ? Math.round((this.correctCount / this.questionsAttempted) * 100)
            : 0;
        this.elements.accuracy.textContent = `${accuracy}%`;
    }

    private goToNextQuestion(): void {
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    }

    private showQuizComplete(): void {
        const finalAccuracy = this.questionsAttempted > 0 
            ? Math.round((this.correctCount / this.questionsAttempted) * 100)
            : 0;
            
        this.elements.questionContainer.innerHTML = `
            <div class="quiz-complete">
                <h2>🎊 Quiz Complete!</h2>
                <p>You've answered all ${this.questions.length} questions.</p>
                <div class="final-stats">
                    <h3>📊 Final Results:</h3>
                    <p><strong>Questions Attempted:</strong> ${this.questionsAttempted}</p>
                    <p><strong>Correct Answers:</strong> ${this.correctCount}</p>
                    <p><strong>Accuracy:</strong> ${finalAccuracy}%</p>
                </div>
                <button onclick="location.reload()" class="restart-button">Start Over</button>
            </div>
        `;
    }
}

// Initialize the quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SimpleQuizApp();
});

export { SimpleQuizApp };
