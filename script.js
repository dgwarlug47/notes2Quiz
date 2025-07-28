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
        
        // Update question number
        this.questionNumberEl.textContent = `Question #${question.questionNumber}`;
        
        // Parse and display question text
        const { questionText, options } = this.parseQuestion(question.question);
        this.questionTextEl.textContent = questionText;
        
        // Clear previous options
        this.answerOptionsEl.innerHTML = '';
        
        // Create answer options
        options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'answer-option';
            optionEl.innerHTML = `
                <span class="option-letter">${option.letter}</span>
                ${option.text}
            `;
            
            optionEl.addEventListener('click', () => {
                if (!this.hasAnswered) {
                    this.selectAnswer(option.letter, optionEl);
                }
            });
            
            this.answerOptionsEl.appendChild(optionEl);
        });
    }

    parseQuestion(questionText) {
        // Split the question text to separate the actual question from the options
        const lines = questionText.split('\n').filter(line => line.trim());
        
        const questionLines = [];
        const options = [];
        let inOptions = false;
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            const optionMatch = trimmedLine.match(/^([A-D])\)\s*(.+)$/);
            
            if (optionMatch) {
                inOptions = true;
                options.push({
                    letter: optionMatch[1],
                    text: optionMatch[2]
                });
            } else if (!inOptions) {
                questionLines.push(line);
            }
        });
        
        return {
            questionText: questionLines.join('\n'),
            options: options
        };
    }

    selectAnswer(selectedLetter, selectedElement) {
        if (this.hasAnswered) return;
        
        this.hasAnswered = true;
        
        // Get correct answer from response
        const correctLetter = this.extractCorrectAnswer(this.currentQuestion.response);
        const isCorrect = selectedLetter === correctLetter;
        
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
            
            if (optionLetter === correctLetter) {
                option.classList.add('correct');
            } else if (optionLetter === selectedLetter && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        // Show result
        this.showResult(isCorrect, selectedLetter, correctLetter);
    }

    extractCorrectAnswer(responseText) {
        // Extract the correct answer letter from various response formats
        const patterns = [
            /([A-D])\)/,           // Pattern: A), B), C), D)
            /\b([A-D])\b/,         // Pattern: single letter A, B, C, D
            /answer:\s*([A-D])/i,  // Pattern: "answer: A" or "Answer: B"
            /correct.*?([A-D])/i   // Pattern: "correct" followed by letter
        ];
        
        for (const pattern of patterns) {
            const match = responseText.match(pattern);
            if (match) {
                return match[1].toUpperCase();
            }
        }
        
        // Fallback: return first letter found
        const fallbackMatch = responseText.match(/[A-D]/);
        return fallbackMatch ? fallbackMatch[0] : 'A';
    }

    showResult(isCorrect, selectedLetter, correctLetter) {
        const message = isCorrect ? 
            `🎉 Correct! Well done!` : 
            `❌ Incorrect. You selected ${selectedLetter}.`;
        
        this.resultMessageEl.textContent = message;
        this.resultMessageEl.className = `result-message ${isCorrect ? 'correct' : 'incorrect'}`;
        
        // Show the correct answer explanation
        this.correctAnswerEl.textContent = `Correct answer: ${correctLetter}) ${this.getOptionText(correctLetter)}`;
        
        // Show the full response from the JSON
        this.fullResponseEl.textContent = this.currentQuestion.response;
        
        this.resultSectionEl.style.display = 'block';
    }

    getOptionText(letter) {
        const { options } = this.parseQuestion(this.currentQuestion.question);
        const option = options.find(opt => opt.letter === letter);
        return option ? option.text : '';
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
