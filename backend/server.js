const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('crypto');
const { sessionHelpers } = require('./redis-client');
const { questions, getScoreCategory } = require('./questions');
const { generateAdvice } = require('./advice-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Generate session ID
function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * POST /api/session/start
 * Create a new session and return session ID
 */
app.post('/api/session/start', async (req, res) => {
    try {
        const sessionId = generateSessionId();
        const session = await sessionHelpers.createSession(sessionId);

        res.json({
            success: true,
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            message: 'Session created successfully'
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create session'
        });
    }
});

/**
 * GET /api/questions
 * Return all questions
 */
app.get('/api/questions', (req, res) => {
    res.json({
        success: true,
        questions: questions
    });
});

/**
 * POST /api/answer
 * Store an answer and update score
 * Body: { sessionId, questionId, answer }
 */
app.post('/api/answer', async (req, res) => {
    try {
        const { sessionId, questionId, answer } = req.body;

        // Validate input
        if (!sessionId || !questionId || answer === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: sessionId, questionId, answer'
            });
        }

        // Check if session exists
        const exists = await sessionHelpers.sessionExists(sessionId);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found or expired'
            });
        }

        // Validate question
        const question = questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID'
            });
        }

        // Validate answer value
        const answerValue = parseInt(answer);
        if (answerValue < 1 || answerValue > 5) {
            return res.status(400).json({
                success: false,
                error: 'Answer must be between 1 and 5'
            });
        }

        // Store answer and update score
        await sessionHelpers.storeAnswer(sessionId, questionId, answerValue, answerValue);

        // Get updated session data
        const sessionData = await sessionHelpers.getSessionData(sessionId);

        res.json({
            success: true,
            message: 'Answer stored successfully',
            currentScore: sessionData.score,
            answeredQuestions: Object.keys(sessionData.answers).length
        });
    } catch (error) {
        console.error('Error storing answer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to store answer'
        });
    }
});

/**
 * POST /api/complete
 * Generate personalized advice based on all answers
 * Body: { sessionId }
 */
app.post('/api/complete', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing sessionId'
            });
        }

        // Check if session exists
        const exists = await sessionHelpers.sessionExists(sessionId);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found or expired'
            });
        }

        // Get session data
        const sessionData = await sessionHelpers.getSessionData(sessionId);

        // Validate that all questions are answered
        if (Object.keys(sessionData.answers).length < questions.length) {
            return res.status(400).json({
                success: false,
                error: 'Not all questions have been answered',
                answeredQuestions: Object.keys(sessionData.answers).length,
                totalQuestions: questions.length
            });
        }

        // Generate advice
        const advice = generateAdvice(sessionData.answers, sessionData.score);

        res.json({
            success: true,
            advice: advice
        });
    } catch (error) {
        console.error('Error generating advice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate advice'
        });
    }
});

/**
 * GET /api/stats
 * Get anonymous global statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await sessionHelpers.getGlobalStats();

        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/session/:sessionId
 * Get current session data (for debugging/testing)
 */
app.get('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const exists = await sessionHelpers.sessionExists(sessionId);
        if (!exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found or expired'
            });
        }

        const sessionData = await sessionHelpers.getSessionData(sessionId);

        res.json({
            success: true,
            session: sessionData
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch session data'
        });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Mental Well-being App Server`);
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log(`💾 Redis session TTL: ${process.env.SESSION_TTL || 1800} seconds\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});
