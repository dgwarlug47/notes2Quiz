class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestion = null;
        this.usedQuestions = new Set();
        this.stats = {
            questionsAnswered: 0,
            correctAnswers: 0
        };
        this.hasAnswered = false;
        
        this.initializeElements();
        this.loadQuestions();
        this.bindEvents();
    }

    initializeElements() {
        this.loadingEl = document.getElementById('loading');
        this.quizContentEl = document.getElementById('quiz-content');
        this.errorMessageEl = document.getElementById('error-message');
        this.questionNumberEl = document.getElementById('question-number');
        this.questionTextEl = document.getElementById('question-text');
        this.answerOptionsEl = document.getElementById('answer-options');
        this.resultSectionEl = document.getElementById('result-section');
        this.resultMessageEl = document.getElementById('result-message');
        this.correctAnswerEl = document.getElementById('correct-answer');
        this.fullResponseEl = document.getElementById('full-response');
        this.newQuestionBtn = document.getElementById('new-question-btn');
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        this.questionsAnsweredEl = document.getElementById('questions-answered');
        this.correctCountEl = document.getElementById('correct-count');
        this.accuracyEl = document.getElementById('accuracy');
    }

    async loadQuestions() {
        try {
            const response = await fetch('quiz_questions.json');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            this.questions = await response.json();
            this.showRandomQuestion();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError();
        }
    }

    bindEvents() {
        this.newQuestionBtn.addEventListener('click', () => {
            this.showRandomQuestion();
        });

        this.nextQuestionBtn.addEventListener('click', () => {
            this.showRandomQuestion();
        });
    }

    hideLoading() {
        this.loadingEl.style.display = 'none';
        this.quizContentEl.style.display = 'block';
    }

    showError() {
        this.loadingEl.style.display = 'none';
        this.errorMessageEl.style.display = 'block';
    }

    showRandomQuestion() {
        if (this.questions.length === 0) return;

        // Reset if all questions have been used
        if (this.usedQuestions.size >= this.questions.length) {
            this.usedQuestions.clear();
        }

        // Find an unused question
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.questions.length);
        } while (this.usedQuestions.has(randomIndex));

        this.usedQuestions.add(randomIndex);
        this.currentQuestion = this.questions[randomIndex];
        this.hasAnswered = false;

        this.displayQuestion();
        this.hideResult();
    }

    displayQuestion() {
        const question = this.currentQuestion;
        
        // Update question header with category and difficulty
        this.questionNumberEl.textContent = `${question.category} - ${question.difficulty}`;
        
        // Display question text directly (no need to parse embedded options)
        this.questionTextEl.textContent = question.question;
        
        // Clear previous options
        this.answerOptionsEl.innerHTML = '';
        
        // Create answer options from alternatives array
        question.alternatives.forEach((alternative, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'answer-option';
            
            // Map index to letter: 0->A, 1->B, 2->C, 3->D
            const letters = ['A', 'B', 'C', 'D'];
            const letter = letters[index];
            const text = alternative; // Use the full alternative text
            
            optionEl.innerHTML = `
                <span class="option-letter">${letter}</span>
                ${text}
            `;
            
            optionEl.addEventListener('click', () => {
                if (!this.hasAnswered) {
                    this.selectAnswer(text, optionEl);
                }
            });
            
            this.answerOptionsEl.appendChild(optionEl);
        });
    }

    selectAnswer(text, selectedElement) {
        if (this.hasAnswered) return;
        
        this.hasAnswered = true;
        
        // Get correct answer from the new answer field
        const correctText = this.currentQuestion.answer;
        const isCorrect = text === correctText;

        // Update stats
        this.stats.questionsAnswered++;
        if (isCorrect) {
            this.stats.correctAnswers++;
        }
        this.updateStats();
        
        // Highlight all options
        const allOptions = this.answerOptionsEl.querySelectorAll('.answer-option');
        allOptions.forEach((option, index) => {
            option.classList.add('disabled');
            const optionLetter = option.querySelector('.option-letter').textContent;
            
            if (isCorrect) {
                option.classList.add('correct');
            } else if (optionLetter === 'A' && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        // Show result
        this.showResult(isCorrect, 'A', 'A');
    }

    extractCorrectAnswer(answerText) {
        // Handle the new answer format: "b. Self-deception or denial of freedom and responsibility"
        // Extract the letter from the beginning of the answer
        const letterMatch = answerText.match(/^([a-dA-D])[\.\)]/);
        if (letterMatch) {
            return letterMatch[1].toUpperCase();
        }
        
        // Fallback patterns for various answer formats
        const patterns = [
            /([A-D])\)/,           // Pattern: A), B), C), D)
            /\b([A-D])\b/,         // Pattern: single letter A, B, C, D
            /answer:\s*([A-D])/i,  // Pattern: "answer: A" or "Answer: B"
            /correct.*?([A-D])/i   // Pattern: "correct" followed by letter
        ];
        
        for (const pattern of patterns) {
            const match = answerText.match(pattern);
            if (match) {
                return match[1].toUpperCase();
            }
        }
        
        // Final fallback: return first letter found
        const fallbackMatch = answerText.match(/[A-D]/i);
        return fallbackMatch ? fallbackMatch[0].toUpperCase() : 'A';
    }

    showResult(isCorrect, selectedLetter, correctLetter) {
        const message = isCorrect ? 
            `🎉 Correct! Well done!` : 
            `❌ Incorrect. You selected ${selectedLetter}.`;
        
        this.resultMessageEl.textContent = message;
        this.resultMessageEl.className = `result-message ${isCorrect ? 'correct' : 'incorrect'}`;
        
        // Show the correct answer explanation
        this.correctAnswerEl.textContent = `Correct answer: ${correctLetter}) ${this.getOptionText(correctLetter)}`;
        
        // Show the full answer from the JSON (new format uses 'answer' field)
        this.fullResponseEl.textContent = this.currentQuestion.answer;
        
        this.resultSectionEl.style.display = 'block';
    }

    getOptionText(letter) {
        // Map letter back to index: A->0, B->1, C->2, D->3
        const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const index = letterToIndex[letter.toUpperCase()];
        
        return this.currentQuestion.alternatives[index] || '';
    }

    hideResult() {
        this.resultSectionEl.style.display = 'none';
    }

    updateStats() {
        this.questionsAnsweredEl.textContent = this.stats.questionsAnswered;
        this.correctCountEl.textContent = this.stats.correctAnswers;
        
        const accuracy = this.stats.questionsAnswered > 0 ? 
            Math.round((this.stats.correctAnswers / this.stats.questionsAnswered) * 100) : 0;
        this.accuracyEl.textContent = `${accuracy}%`;
    }
}

// Initialize the quiz app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
