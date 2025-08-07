'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface QuizQuestion {
  category: string;
  difficulty: string;
  context?: string;
  question: string;
  alternatives: string[];
  answer: string;
}

type AnswerLetter = 'A' | 'B' | 'C' | 'D';

interface QuizState {
  currentQuestionIndex: number;
  questionsAttempted: number;
  correctCount: number;
  isTextMode: boolean;
  shuffledQuestions: QuizQuestion[];
}

export default function QuizApp() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isTextMode, setIsTextMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean;
    selectedLetter?: AnswerLetter;
    correctLetter: AnswerLetter;
    userAnswer?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringFromCheckpoint, setRestoringFromCheckpoint] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Save quiz state to localStorage
  const saveState = useCallback(() => {
    if (questions.length === 0) return;
    
    const state: QuizState = {
      currentQuestionIndex,
      questionsAttempted,
      correctCount,
      isTextMode,
      shuffledQuestions: questions
    };
    
    try {
      localStorage.setItem('quizCheckpoint', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save quiz state:', error);
    }
  }, [currentQuestionIndex, questionsAttempted, correctCount, isTextMode, questions]);

  // Load quiz state from localStorage
  const loadState = useCallback((): QuizState | null => {
    try {
      const savedState = localStorage.getItem('quizCheckpoint');
      if (savedState) {
        return JSON.parse(savedState) as QuizState;
      }
    } catch (error) {
      console.warn('Failed to load quiz state:', error);
    }
    return null;
  }, []);

  // Clear saved state
  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem('quizCheckpoint');
    } catch (error) {
      console.warn('Failed to clear quiz state:', error);
    }
  }, []);

  // Save state whenever relevant data changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/quiz_questions.json');
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Check for saved state first
        const savedState = loadState();
        
        if (savedState && savedState.shuffledQuestions.length > 0) {
          // Restore from checkpoint
          setRestoringFromCheckpoint(true);
          setQuestions(savedState.shuffledQuestions);
          setCurrentQuestionIndex(savedState.currentQuestionIndex);
          setQuestionsAttempted(savedState.questionsAttempted);
          setCorrectCount(savedState.correctCount);
          setIsTextMode(savedState.isTextMode);
          setLoading(false);
          setTimeout(() => setRestoringFromCheckpoint(false), 2000); // Show message for 2 seconds
          return;
        }
        
        // No saved state, shuffle questions using Fisher-Yates algorithm
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        setQuestions(shuffled);
        setLoading(false);
      } catch (error) {
        console.error('Error loading questions:', error);
        setError('Failed to load quiz questions. Please refresh the page.');
        setLoading(false);
      }
    };

    loadQuestions();
  }, [loadState]);

  const extractCorrectAnswer = useCallback((answerText: string): AnswerLetter => {
    if (!currentQuestion) return 'A';
    
    const letters: AnswerLetter[] = ['A', 'B', 'C', 'D'];
    
    for (let i = 0; i < currentQuestion.alternatives.length; i++) {
      const alternative = currentQuestion.alternatives[i];
      if (alternative.toLowerCase().trim() === answerText.toLowerCase().trim()) {
        return letters[i];
      }
    }
    
    console.error('No matching alternative found for answer:', answerText);
    throw new Error(`Could not find matching alternative for answer: "${answerText}"`);
  }, [currentQuestion]);

  const getOptionText = useCallback((letter: AnswerLetter): string => {
    if (!currentQuestion) return '';
    const letterToIndex: Record<AnswerLetter, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const index = letterToIndex[letter];
    return currentQuestion.alternatives[index] || '';
  }, [currentQuestion]);

  const selectOption = (selectedLetter: AnswerLetter) => {
    if (hasAnswered || !currentQuestion) return;

    setHasAnswered(true);
    const correctLetter = extractCorrectAnswer(currentQuestion.answer);
    const isCorrect = selectedLetter === correctLetter;

    setQuestionsAttempted(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setFeedbackData({
      isCorrect,
      selectedLetter,
      correctLetter
    });
    setShowFeedback(true);
  };

  const submitTextAnswer = () => {
    if (hasAnswered || !currentQuestion || !userAnswer.trim()) return;

    setHasAnswered(true);
    const correctLetter = extractCorrectAnswer(currentQuestion.answer);
    const correctOptionText = getOptionText(correctLetter);

    setShowSelfAssessment(true);
    setFeedbackData({
      isCorrect: false, // Will be determined by self-assessment
      correctLetter,
      userAnswer: userAnswer.trim()
    });
  };

  const handleSelfAssessment = (isCorrect: boolean) => {
    setQuestionsAttempted(prev => prev + 1);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setShowSelfAssessment(false);
    setFeedbackData(prev => prev ? { ...prev, isCorrect } : null);
    setShowFeedback(true);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // Quiz complete
      return;
    }

    setCurrentQuestionIndex(prev => prev + 1);
    setHasAnswered(false);
    setUserAnswer('');
    setShowSelfAssessment(false);
    setShowFeedback(false);
    setFeedbackData(null);
  };

  const toggleMode = () => {
    setIsTextMode(prev => !prev);
    setHasAnswered(false);
    setUserAnswer('');
    setShowSelfAssessment(false);
    setShowFeedback(false);
    setFeedbackData(null);
  };

  const accuracy = questionsAttempted > 0 
    ? Math.round((correctCount / questionsAttempted) * 100)
    : 0;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>{restoringFromCheckpoint ? 'Restoring from checkpoint...' : 'Loading questions...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>⚠️ Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    const finalAccuracy = questionsAttempted > 0 
      ? Math.round((correctCount / questionsAttempted) * 100)
      : 0;

    // Clear saved state when quiz is complete
    useEffect(() => {
      clearSavedState();
    }, [clearSavedState]);

    return (
      <div className="quiz-complete">
        <h2>🎊 Quiz Complete!</h2>
        <p>You've answered all {questions.length} questions.</p>
        <div className="final-stats">
          <h3>📊 Final Results:</h3>
          <p><strong>Questions Attempted:</strong> {questionsAttempted}</p>
          <p><strong>Correct Answers:</strong> {correctCount}</p>
          <p><strong>Accuracy:</strong> {finalAccuracy}%</p>
        </div>
        <button 
          onClick={() => {
            clearSavedState();
            window.location.reload();
          }} 
          className="restart-button"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {restoringFromCheckpoint && (
        <div className="checkpoint-notification">
          📍 Restored from checkpoint - continuing where you left off!
        </div>
      )}
      
      <header>
        <h1>
          <Image 
            src="/profile-pic.jpeg" 
            alt="Profile Picture" 
            width={120}
            height={120}
            className="profile-pic"
          />
          Vamos Argentina Quiz Generator
        </h1>
        <p>Answer one question at a time</p>
        <div className="checkpoint-controls">
          <div className="checkpoint-indicator">
            💾 Progress auto-saved
          </div>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to restart the quiz? This will clear your progress.')) {
                clearSavedState();
                window.location.reload();
              }
            }}
            className="restart-quiz-button"
            title="Start over from the beginning"
          >
            🔄 Restart Quiz
          </button>
        </div>
      </header>

      <main className="question-container">
        <div className="question-counter">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Attempted:</span>
            <span>{questionsAttempted}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Correct:</span>
            <span>{correctCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy:</span>
            <span>{accuracy}%</span>
          </div>
        </div>

        <div className="mode-toggle-container">
          <button onClick={toggleMode} className="mode-toggle">
            {isTextMode ? '🔲 Switch to Multiple Choice' : '✏️ Switch to Text Input'}
          </button>
        </div>
        
        <div className="question-text">
          <div className="question-category">
            {currentQuestion.category} - {currentQuestion.difficulty}
          </div>
          {currentQuestion.context && (
            <div className="question-context">
              {currentQuestion.context}
            </div>
          )}
          <div className="question-content">
            {currentQuestion.question}
          </div>
        </div>
        
        {!isTextMode && !showFeedback && !showSelfAssessment && (
          <div className="options-container">
            {currentQuestion.alternatives.map((alternative, index) => {
              const letters: AnswerLetter[] = ['A', 'B', 'C', 'D'];
              const letter = letters[index];
              const correctLetter = feedbackData?.correctLetter;
              const selectedLetter = feedbackData?.selectedLetter;
              
              let buttonClass = 'option-button';
              if (hasAnswered) {
                if (letter === correctLetter) {
                  buttonClass += ' correct';
                } else if (letter === selectedLetter && !feedbackData?.isCorrect) {
                  buttonClass += ' incorrect';
                } else {
                  buttonClass += ' disabled';
                }
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => selectOption(letter)}
                  disabled={hasAnswered}
                >
                  <span className="option-letter">{letter}</span>
                  <span className="option-text">{alternative}</span>
                </button>
              );
            })}
          </div>
        )}

        {isTextMode && !showFeedback && !showSelfAssessment && (
          <div className="text-input-container">
            <div className="input-group">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !hasAnswered) {
                    submitTextAnswer();
                  }
                }}
                className="answer-input"
                placeholder="Type your answer here..."
                disabled={hasAnswered}
              />
              <button
                onClick={submitTextAnswer}
                className="submit-button"
                disabled={hasAnswered || !userAnswer.trim()}
              >
                Submit Answer
              </button>
            </div>
            <p className="input-hint">💡 Type your answer and press Enter or click Submit</p>
          </div>
        )}

        {showSelfAssessment && feedbackData && (
          <div className="self-assessment-container">
            <div className="assessment-content">
              <h3>🤔 How did you do?</h3>
              <p>Compare your answer with the correct one below and assess yourself:</p>
              <div className="answer-comparison">
                <h4>Your Answer:</h4>
                <p className="user-answer">"{feedbackData.userAnswer}"</p>
                <h4>Correct Answer:</h4>
                <p className="correct-answer">
                  {feedbackData.correctLetter}) {getOptionText(feedbackData.correctLetter)}
                </p>
              </div>
              <div className="assessment-buttons">
                <button
                  onClick={() => handleSelfAssessment(true)}
                  className="assessment-button correct-btn"
                >
                  ✅ I got it right!
                </button>
                <button
                  onClick={() => handleSelfAssessment(false)}
                  className="assessment-button incorrect-btn"
                >
                  ❌ I got it wrong
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showFeedback && feedbackData && (
          <div className="feedback-container">
            <div className="feedback-message">
              <div className={feedbackData.isCorrect ? "feedback-correct" : "feedback-incorrect"}>
                <h3>{feedbackData.isCorrect ? "🎉 Correct!" : "❌ Incorrect"}</h3>
                {feedbackData.isCorrect ? (
                  <p>
                    Well done! 
                    {feedbackData.userAnswer 
                      ? ` Your answer "${feedbackData.userAnswer}" is correct!`
                      : ` You selected the right answer: ${feedbackData.correctLetter}) ${getOptionText(feedbackData.correctLetter)}`
                    }
                  </p>
                ) : (
                  <>
                    {feedbackData.userAnswer ? (
                      <p>Your answer: "<strong>{feedbackData.userAnswer}</strong>"</p>
                    ) : (
                      <p>You selected: <strong>{feedbackData.selectedLetter})</strong></p>
                    )}
                    <p>
                      The correct answer is: <strong>
                        {feedbackData.correctLetter}) {getOptionText(feedbackData.correctLetter)}
                      </strong>
                    </p>
                  </>
                )}
              </div>
              
              <div className="stats-summary">
                <p>
                  <strong>📊 Your Progress:</strong> {correctCount}/{questionsAttempted} correct ({accuracy}%)
                </p>
              </div>
            </div>
            <button onClick={goToNextQuestion} className="next-button">
              Next Question →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
