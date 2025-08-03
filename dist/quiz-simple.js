class SimpleQuizApp {
    questions = [];
    currentQuestionIndex = 0;
    currentQuestion = null;
    elements;
    hasAnswered = false;
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
        return {
            questionContainer: getElement('question-container'),
            questionText: getElement('question-text'),
            optionsContainer: getElement('options-container'),
            feedbackContainer: getElement('feedback-container'),
            feedbackMessage: getElement('feedback-message'),
            nextButton: getButton('next-button'),
            questionCounter: getElement('question-counter'),
            loadingElement: getElement('loading')
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
        // Clear and create options
        this.elements.optionsContainer.innerHTML = '';
        this.createOptions();
        // Hide feedback and next button
        this.elements.feedbackContainer.style.display = 'none';
        this.elements.nextButton.style.display = 'none';
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
    selectOption(selectedLetter, selectedElement) {
        if (this.hasAnswered || !this.currentQuestion)
            return;
        this.hasAnswered = true;
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion.answer);
        const isCorrect = selectedLetter === correctLetter;
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
        // Handle the answer format: "b. Self-deception or denial of freedom and responsibility"
        const letterMatch = answerText.match(/^([a-dA-D])[\.\)]/);
        if (letterMatch) {
            return letterMatch[1].toUpperCase();
        }
        // Fallback patterns
        const patterns = [
            /([A-D])\)/, // A), B), C), D)
            /\b([A-D])\b/, // A, B, C, D
            /answer:\s*([A-D])/i, // answer: A
            /correct.*?([A-D])/i // correct A
        ];
        for (const pattern of patterns) {
            const match = answerText.match(pattern);
            if (match) {
                return match[1].toUpperCase();
            }
        }
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
        // Show full explanation if available
        if (this.currentQuestion?.answer) {
            this.elements.feedbackMessage.innerHTML += `
                <div class="explanation">
                    <h4>📝 Explanation:</h4>
                    <p>${this.currentQuestion.answer}</p>
                </div>
            `;
        }
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
    goToNextQuestion() {
        this.currentQuestionIndex++;
        this.displayCurrentQuestion();
    }
    showQuizComplete() {
        this.elements.questionContainer.innerHTML = `
            <div class="quiz-complete">
                <h2>🎊 Quiz Complete!</h2>
                <p>You've answered all ${this.questions.length} questions.</p>
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