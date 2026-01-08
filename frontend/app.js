// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    sessionId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    totalScore: 0
};

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Screens
    welcomeScreen: document.getElementById('welcome-screen'),
    questionnaireScreen: document.getElementById('questionnaire-screen'),
    resultsScreen: document.getElementById('results-screen'),
    statsScreen: document.getElementById('stats-screen'),

    // Buttons
    startBtn: document.getElementById('start-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    restartBtn: document.getElementById('restart-btn'),
    statsBtn: document.getElementById('stats-btn'),
    backToResultsBtn: document.getElementById('back-to-results-btn'),

    // Containers
    questionContainer: document.getElementById('question-container'),
    adviceContainer: document.getElementById('advice-container'),
    statsContainer: document.getElementById('stats-container'),

    // Progress
    progressFill: document.getElementById('progress-fill'),
    progressCurrent: document.getElementById('progress-current'),
    progressTotal: document.getElementById('progress-total'),

    // Results
    scoreValue: document.getElementById('score-value'),
    scoreCategory: document.getElementById('score-category'),
    resultsTitle: document.getElementById('results-title'),

    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),

    // Score Indicator
    runningScoreValue: document.getElementById('running-score-value')
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show requested screen
    const screenMap = {
        'welcome': elements.welcomeScreen,
        'questionnaire': elements.questionnaireScreen,
        'results': elements.resultsScreen,
        'stats': elements.statsScreen
    };

    if (screenMap[screenName]) {
        screenMap[screenName].classList.add('active');
    }
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ============================================
// SESSION MANAGEMENT
// ============================================
async function startSession() {
    try {
        showLoading();

        // Create new session
        const sessionData = await apiCall('/session/start', 'POST');
        state.sessionId = sessionData.sessionId;

        // Store session ID in sessionStorage
        sessionStorage.setItem('wellbeingSessionId', state.sessionId);

        // Fetch questions
        const questionsData = await apiCall('/questions');
        state.questions = questionsData.questions;

        // Initialize progress
        elements.progressTotal.textContent = state.questions.length;

        // Show questionnaire
        showScreen('questionnaire');
        renderQuestion();

        hideLoading();
    } catch (error) {
        console.error('Error starting session:', error);
        alert('Failed to start session. Please make sure the server is running.');
        hideLoading();
    }
}

// ============================================
// QUESTION RENDERING
// ============================================
function renderQuestion() {
    const question = state.questions[state.currentQuestionIndex];

    elements.questionContainer.innerHTML = `
        <div class="question">
            <h3>${question.question}</h3>
            <div class="options">
                ${question.options.map(option => `
                    <div class="option" data-value="${option.value}">
                        <span class="option-emoji">${option.emoji}</span>
                        <div class="option-content">
                            <div class="option-label">${option.label}</div>
                            <div class="option-value">Score: ${option.value}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add click handlers to options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectOption(option));
    });

    // Restore previous answer if exists
    if (state.answers[question.id]) {
        const selectedOption = document.querySelector(`.option[data-value="${state.answers[question.id]}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            elements.nextBtn.disabled = false;
        }
    }

    // Update progress
    updateProgress();

    // Update navigation buttons
    updateNavigationButtons();
}

function selectOption(optionElement) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Add selection to clicked option
    optionElement.classList.add('selected');

    // Store answer
    const question = state.questions[state.currentQuestionIndex];
    const value = parseInt(optionElement.dataset.value);

    // If an answer for this question already exists, subtract its value from totalScore
    if (state.answers[question.id]) {
        state.totalScore -= state.answers[question.id];
    }

    state.answers[question.id] = value;

    // Update local score
    state.totalScore += value;

    // Update running score display
    elements.runningScoreValue.textContent = state.totalScore;

    // Enable next button
    elements.nextBtn.disabled = false;

    // Auto-advance after short delay (optional, feels smoother)
    setTimeout(() => {
        if (state.currentQuestionIndex < state.questions.length - 1) {
            nextQuestion();
        }
    }, 300);
}

function updateProgress() {
    const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.progressCurrent.textContent = state.currentQuestionIndex + 1;
}

function updateNavigationButtons() {
    // Previous button
    if (state.currentQuestionIndex === 0) {
        elements.prevBtn.style.display = 'none';
    } else {
        elements.prevBtn.style.display = 'inline-flex';
    }

    // Next button
    const question = state.questions[state.currentQuestionIndex];
    const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1;

    if (isLastQuestion) {
        elements.nextBtn.innerHTML = '<span>Complete</span><span class="btn-icon">✓</span>';
    } else {
        elements.nextBtn.innerHTML = '<span>Next</span><span class="btn-icon">→</span>';
    }

    // Disable next if no answer selected
    if (!state.answers[question.id]) {
        elements.nextBtn.disabled = true;
    }
}

// ============================================
// NAVIGATION
// ============================================
async function nextQuestion() {
    const question = state.questions[state.currentQuestionIndex];
    const answer = state.answers[question.id];

    if (!answer) {
        return;
    }

    try {
        // Submit answer to backend
        await apiCall('/answer', 'POST', {
            sessionId: state.sessionId,
            questionId: question.id,
            answer: answer
        });

        // Move to next question or complete
        if (state.currentQuestionIndex < state.questions.length - 1) {
            state.currentQuestionIndex++;
            renderQuestion();
        } else {
            // All questions answered, show results
            await completeAssessment();
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        alert('Failed to submit answer. Please try again.');
    }
}

function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderQuestion();
    }
}

// ============================================
// RESULTS
// ============================================
async function completeAssessment() {
    try {
        showLoading();

        // Get personalized advice
        const result = await apiCall('/complete', 'POST', {
            sessionId: state.sessionId
        });

        const advice = result.advice;

        // Display results
        displayResults(advice);

        showScreen('results');
        hideLoading();
    } catch (error) {
        console.error('Error completing assessment:', error);
        alert('Failed to generate results. Please try again.');
        hideLoading();
    }
}

function displayResults(advice) {
    // Update score display
    elements.scoreValue.textContent = advice.score;
    elements.scoreCategory.textContent = advice.categoryLabel;

    // Build advice HTML
    let adviceHTML = `
        <div class="advice-section">
            <h3>${advice.mainAdvice.title}</h3>
            <p>${advice.mainAdvice.message}</p>
            <p><strong>What you can do:</strong> ${advice.mainAdvice.action}</p>
        </div>
    `;

    // Add specific tips
    if (advice.specificTips && advice.specificTips.length > 0) {
        adviceHTML += `
            <div class="advice-section">
                <h3>Personalized Tips</h3>
                <div class="advice-tips">
                    ${advice.specificTips.map(tip => `
                        <div class="tip-item">${tip}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add resources
    if (advice.resources && advice.resources.length > 0) {
        adviceHTML += `
            <div class="advice-section">
                <h3>Helpful Resources</h3>
                <div class="resources">
                    ${advice.resources.map(resource => `
                        <div class="resource-item ${resource.urgent ? 'urgent' : ''}">
                            <strong>${resource.name}</strong>
                            <p>${resource.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add reminder disclaimer
    adviceHTML += `
        <div class="advice-section" style="border-left-color: #ffc107;">
            <h3>⚠️ Remember</h3>
            <p>This is a self-reflection tool, not a medical diagnosis. If you're experiencing persistent difficulties, please reach out to a qualified mental health professional.</p>
        </div>
    `;

    elements.adviceContainer.innerHTML = adviceHTML;
}

// ============================================
// STATISTICS
// ============================================
async function showStatistics() {
    try {
        showLoading();

        const statsData = await apiCall('/stats');
        const stats = statsData.stats;

        displayStatistics(stats);

        showScreen('stats');
        hideLoading();
    } catch (error) {
        console.error('Error fetching statistics:', error);
        alert('Failed to load statistics.');
        hideLoading();
    }
}

function displayStatistics(stats) {
    let statsHTML = `
        <div class="stat-card">
            <h3>📊 Overall Statistics</h3>
            <div class="stat-item">
                <span class="stat-label">Total Sessions</span>
                <span class="stat-value">${stats.totalSessions || 0}</span>
            </div>
        </div>
    `;

    // Display question statistics
    const questionLabels = {
        mood: '😊 Mood',
        energy: '⚡ Energy',
        stress: '🧘 Stress',
        sleep: '😴 Sleep',
        motivation: '🚀 Motivation'
    };

    for (const [questionId, questionStats] of Object.entries(stats.questionStats)) {
        const total = Object.values(questionStats).reduce((sum, count) => sum + parseInt(count || 0), 0);

        if (total > 0) {
            statsHTML += `
                <div class="stat-card">
                    <h3>${questionLabels[questionId] || questionId}</h3>
                    ${[1, 2, 3, 4, 5].map(value => {
                const count = parseInt(questionStats[value] || 0);
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                return `
                            <div class="stat-item">
                                <span class="stat-label">Level ${value}</span>
                                <span class="stat-value">${count} (${percentage}%)</span>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }
    }

    elements.statsContainer.innerHTML = statsHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================
elements.startBtn.addEventListener('click', startSession);
elements.nextBtn.addEventListener('click', nextQuestion);
elements.prevBtn.addEventListener('click', previousQuestion);
elements.restartBtn.addEventListener('click', () => {
    // Reset state
    state.sessionId = null;
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.totalScore = 0;
    elements.runningScoreValue.textContent = '0';

    // Clear session storage
    sessionStorage.removeItem('wellbeingSessionId');

    // Show welcome screen
    showScreen('welcome');
});
elements.statsBtn.addEventListener('click', showStatistics);
elements.backToResultsBtn.addEventListener('click', () => showScreen('results'));

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's an existing session
    const existingSessionId = sessionStorage.getItem('wellbeingSessionId');

    if (existingSessionId) {
        // Could optionally restore session here
        // For now, just clear it and start fresh
        sessionStorage.removeItem('wellbeingSessionId');
    }

    // Show welcome screen
    showScreen('welcome');
});
