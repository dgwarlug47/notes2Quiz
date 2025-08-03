class SimpleQuizApp {
    questions = [];
    currentQuestionIndex = 0;
    currentQuestion = null;
    elements;
    hasAnswered = false;
    questionsAttempted = 0;
    correctCount = 0;
    isTextMode = false;
    constructor() {
        this.elements = this.initializeElements();
        this.loadQuestions();
        this.bindEvents();
    }
    initializeElements() {
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Element with id "${id}" not found`);
            }
            return element;
        };
        const getButton = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Button with id "${id}" not found`);
            }
            return element;
        };
        const getInput = (id) => {
            const element = document.getElementById(id);
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
    async loadQuestions() {
        try {
            const response = await fetch('quiz_questions.json');
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.statusText}`);
            }
            this.questions = await response.json();
            this.shuffleQuestions();
            this.hideLoading();
            this.displayCurrentQuestion();
        }
        catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Failed to load quiz questions. Please refresh the page.');
        }
    }
    shuffleQuestions() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }
    bindEvents() {
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
    hideLoading() {
        this.elements.loadingElement.style.display = 'none';
        this.elements.questionContainer.style.display = 'block';
    }
    showError(message) {
        this.elements.loadingElement.innerHTML = `
            <div class="error">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
    displayCurrentQuestion() {
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
        // Show appropriate input method based on mode
        if (this.isTextMode) {
            this.showTextInput();
        }
        else {
            this.showMultipleChoice();
        }
        // Hide feedback and next button
        this.elements.feedbackContainer.style.display = 'none';
        this.elements.nextButton.style.display = 'none';
        // Hide self-assessment container
        this.elements.selfAssessmentContainer.style.display = 'none';
    }
    createOptions() {
        if (!this.currentQuestion)
            return;
        const letters = ['A', 'B', 'C', 'D'];
        this.currentQuestion.alternatives.forEach((alternative, index) => {
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
    showMultipleChoice() {
        this.elements.optionsContainer.style.display = 'flex';
        this.elements.textInputContainer.style.display = 'none';
        this.elements.optionsContainer.innerHTML = '';
        this.createOptions();
    }
    showTextInput() {
        this.elements.optionsContainer.style.display = 'none';
        this.elements.textInputContainer.style.display = 'block';
        this.elements.answerInput.value = '';
        this.elements.answerInput.disabled = false;
        this.elements.submitButton.disabled = false;
        this.elements.answerInput.focus();
    }
    toggleMode() {
        this.isTextMode = !this.isTextMode;
        this.elements.modeToggle.textContent = this.isTextMode ?
            '🔲 Switch to Multiple Choice' :
            '✏️ Switch to Text Input';
        // Reset current question display
        this.displayCurrentQuestion();
    }
    submitTextAnswer() {
        if (this.hasAnswered || !this.currentQuestion)
            return;
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
    checkTextAnswer(userAnswer, correctAnswer) {
        const normalizeText = (text) => {
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
    showTextFeedback(isCorrect, userAnswer, correctLetter, correctAnswer) {
        if (isCorrect) {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-correct">
                    <h3>🎉 Correct!</h3>
                    <p>Well done! Your answer "<strong>${userAnswer}</strong>" is correct!</p>
                    <p>The correct answer is: <strong>${correctLetter}) ${correctAnswer}</strong></p>
                </div>
            `;
        }
        else {
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
    selectOption(selectedLetter, selectedElement) {
        if (this.hasAnswered || !this.currentQuestion)
            return;
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
        allOptions.forEach((option) => {
            const optionElement = option;
            optionElement.disabled = true;
            const letterElement = optionElement.querySelector('.option-letter');
            if (!letterElement)
                return;
            const optionLetter = letterElement.textContent;
            if (optionLetter === correctLetter) {
                optionElement.classList.add('correct');
            }
            else if (optionLetter === selectedLetter && !isCorrect) {
                optionElement.classList.add('incorrect');
            }
            else {
                optionElement.classList.add('disabled');
            }
        });
        // Show feedback
        this.showFeedback(isCorrect, selectedLetter, correctLetter);
    }
    extractCorrectAnswer(answerText) {
        if (!this.currentQuestion)
            return 'A';
        const letters = ['A', 'B', 'C', 'D'];
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
    showFeedback(isCorrect, selectedLetter, correctLetter) {
        const correctOptionText = this.getOptionText(correctLetter);
        if (isCorrect) {
            this.elements.feedbackMessage.innerHTML = `
                <div class="feedback-correct">
                    <h3>🎉 Correct!</h3>
                    <p>Well done! You selected the right answer: <strong>${correctLetter}) ${correctOptionText}</strong></p>
                </div>
            `;
        }
        else {
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
    getOptionText(letter) {
        if (!this.currentQuestion)
            return '';
        const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const index = letterToIndex[letter];
        return this.currentQuestion.alternatives[index] || '';
    }
    updateStatistics() {
        this.elements.questionsAttempted.textContent = this.questionsAttempted.toString();
        this.elements.correctAnswers.textContent = this.correctCount.toString();
        const accuracy = this.questionsAttempted > 0
            ? Math.round((this.correctCount / this.questionsAttempted) * 100)
            : 0;
        this.elements.accuracy.textContent = `${accuracy}%`;
    }
    showSelfAssessment(userAnswer, correctLetter, correctAnswer) {
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
    handleSelfAssessment(isCorrect) {
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
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion.answer);
        const correctAnswer = this.getOptionText(correctLetter);
        this.showTextFeedback(isCorrect, userAnswer, correctLetter, correctAnswer);
    }
    goToNextQuestion() {
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    }
    showQuizComplete() {
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
//# sourceMappingURL=quiz-simple.js.map