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
    textInputContainer: HTMLElement;
    answerInput: HTMLInputElement;
    submitButton: HTMLButtonElement;
    modeToggle: HTMLButtonElement;
    selfAssessmentContainer: HTMLElement;
    correctButton: HTMLButtonElement;
    incorrectButton: HTMLButtonElement;
}

class SimpleQuizApp {
    private questions: QuizQuestion[] = [];
    private currentQuestionIndex: number = 0;
    private currentQuestion: QuizQuestion | null = null;
    private elements: SimpleQuizElements;
    private hasAnswered: boolean = false;
    private questionsAttempted: number = 0;
    private correctCount: number = 0;
    private isTextMode: boolean = false;

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

        const getInput = (id: string): HTMLInputElement => {
            const element = document.getElementById(id) as HTMLInputElement;
            if (!element) {
                throw new Error(`Input with id "${id}" not found`);
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
            accuracy: getElement('accuracy'),
            textInputContainer: getElement('text-input-container'),
            answerInput: getInput('answer-input'),
            submitButton: getButton('submit-button'),
            modeToggle: getButton('mode-toggle'),
            selfAssessmentContainer: getElement('self-assessment-container'),
            correctButton: getButton('correct-button'),
            incorrectButton: getButton('incorrect-button')
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

        this.elements.modeToggle.addEventListener('click', () => {
            this.toggleMode();
        });

        this.elements.submitButton.addEventListener('click', () => {
            this.submitTextAnswer();
        });

        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.hasAnswered) {
                this.submitTextAnswer();
            }
        });

        this.elements.correctButton.addEventListener('click', () => {
            this.handleSelfAssessment(true);
        });

        this.elements.incorrectButton.addEventListener('click', () => {
            this.handleSelfAssessment(false);
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
        const contextHtml = this.currentQuestion.context 
            ? `<div class="question-context">${this.currentQuestion.context}</div>` 
            : '';
            
        this.elements.questionText.innerHTML = `
            <div class="question-category">${this.currentQuestion.category} - ${this.currentQuestion.difficulty}</div>
            ${contextHtml}
            <div class="question-content">${this.currentQuestion.question}</div>
        `;

        // Show appropriate input method based on mode
        if (this.isTextMode) {
            this.showTextInput();
        } else {
            this.showMultipleChoice();
        }

        // Hide feedback and next button
        this.elements.feedbackContainer.style.display = 'none';
        this.elements.nextButton.style.display = 'none';
        
        // Hide self-assessment container
        this.elements.selfAssessmentContainer.style.display = 'none';
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

    private showMultipleChoice(): void {
        this.elements.optionsContainer.style.display = 'flex';
        this.elements.textInputContainer.style.display = 'none';
        this.elements.optionsContainer.innerHTML = '';
        this.createOptions();
    }

    private showTextInput(): void {
        this.elements.optionsContainer.style.display = 'none';
        this.elements.textInputContainer.style.display = 'block';
        this.elements.answerInput.value = '';
        this.elements.answerInput.disabled = false;
        this.elements.submitButton.disabled = false;
        this.elements.answerInput.focus();
    }

    private toggleMode(): void {
        this.isTextMode = !this.isTextMode;
        this.elements.modeToggle.textContent = this.isTextMode ? 
            '🔲 Switch to Multiple Choice' : 
            '✏️ Switch to Text Input';
        
        // Reset current question display
        this.displayCurrentQuestion();
    }

    private submitTextAnswer(): void {
        if (this.hasAnswered || !this.currentQuestion) return;

        const userAnswer = this.elements.answerInput.value.trim();
        if (!userAnswer) {
            alert('Please enter an answer before submitting.');
            return;
        }

        this.hasAnswered = true;
        this.elements.answerInput.disabled = true;
        this.elements.submitButton.disabled = true;

        // Find the correct answer
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion.answer);
        const correctOptionText = this.getOptionText(correctLetter);
        
        // Show self-assessment instead of automatic checking
        this.showSelfAssessment(userAnswer, correctLetter, correctOptionText);
    }

    private checkTextAnswer(userAnswer: string, correctAnswer: string): boolean {
        const normalizeText = (text: string) => {
            return text.toLowerCase()
                      .trim()
                      .replace(/[^\w\s]/g, '') // Remove punctuation
                      .replace(/\s+/g, ' '); // Normalize spaces
        };

        const normalizedUser = normalizeText(userAnswer);
        const normalizedCorrect = normalizeText(correctAnswer);

        // Check exact match
        if (normalizedUser === normalizedCorrect) {
            return true;
        }

        // Check if user answer contains the correct answer or vice versa
        if (normalizedUser.includes(normalizedCorrect) || 
            normalizedCorrect.includes(normalizedUser)) {
            return true;
        }

        // Check against all alternatives for partial matches
        if (this.currentQuestion) {
            for (const alternative of this.currentQuestion.alternatives) {
                const normalizedAlt = normalizeText(alternative);
                if (normalizedUser === normalizedAlt || 
                    normalizedUser.includes(normalizedAlt) ||
                    normalizedAlt.includes(normalizedUser)) {
                    return normalizedAlt === normalizedCorrect;
                }
            }
        }

        return false;
    }

    private showTextFeedback(isCorrect: boolean, userAnswer: string, correctLetter: AnswerLetter, correctAnswer: string): void {
        if (isCorrect) {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-correct">
                    <h3>🎉 Correct!</h3>
                    <p>Well done! Your answer "<strong>${userAnswer}</strong>" is correct!</p>
                    <p>The correct answer is: <strong>${correctLetter}) ${correctAnswer}</strong></p>
                </div>
            `;
        } else {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-incorrect">
                    <h3>❌ Incorrect</h3>
                    <p>Your answer: "<strong>${userAnswer}</strong>"</p>
                    <p>The correct answer is: <strong>${correctLetter}) ${correctAnswer}</strong></p>
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

    private showSelfAssessment(userAnswer: string, correctLetter: AnswerLetter, correctAnswer: string): void {
        // Update the answer comparison section
        const comparisonElement = document.getElementById('answer-comparison');
        if (comparisonElement) {
            comparisonElement.innerHTML = `
                <h4>Your Answer:</h4>
                <p class="user-answer">"${userAnswer}"</p>
                <h4>Correct Answer:</h4>
                <p class="correct-answer">${correctLetter}) ${correctAnswer}</p>
            `;
        }

        // Show self-assessment container
        this.elements.selfAssessmentContainer.style.display = 'block';
        
        // Hide text input container
        this.elements.textInputContainer.style.display = 'none';
    }

    private handleSelfAssessment(isCorrect: boolean): void {
        // Update statistics based on user's self-assessment
        this.questionsAttempted++;
        if (isCorrect) {
            this.correctCount++;
        }
        this.updateStatistics();

        // Hide self-assessment container
        this.elements.selfAssessmentContainer.style.display = 'none';

        // Show feedback
        const userAnswer = this.elements.answerInput.value.trim();
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion!.answer);
        const correctAnswer = this.getOptionText(correctLetter);
        
        this.showTextFeedback(isCorrect, userAnswer, correctLetter, correctAnswer);
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
