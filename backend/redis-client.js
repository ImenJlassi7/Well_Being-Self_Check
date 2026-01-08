const redis = require('redis');
require('dotenv').config();

// Create Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Error handling
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('✓ Connected to Redis');
});

// Connect to Redis
(async () => {
  await client.connect();
})();

// Session TTL in seconds (default: 30 minutes)
const SESSION_TTL = parseInt(process.env.SESSION_TTL) || 1800;

/**
 * Redis Key Structure:
 * - session:{sessionId}:answers     → Hash of question answers
 * - session:{sessionId}:score       → Total score counter
 * - session:{sessionId}:metadata    → Session metadata (creation time, etc.)
 * - stats:question:{questionId}     → Hash of answer counts (global stats)
 * - stats:total:sessions            → Counter of total sessions created
 */

// Helper functions for session management
const sessionHelpers = {
  /**
   * Create a new session with TTL
   */
  async createSession(sessionId) {
    const timestamp = new Date().toISOString();
    
    // Initialize session metadata
    await client.hSet(`session:${sessionId}:metadata`, {
      createdAt: timestamp,
      status: 'active'
    });
    
    // Set TTL on all session keys
    await client.expire(`session:${sessionId}:metadata`, SESSION_TTL);
    
    // Increment global session counter
    await client.incr('stats:total:sessions');
    
    return { sessionId, createdAt: timestamp };
  },

  /**
   * Store an answer and update score
   */
  async storeAnswer(sessionId, questionId, answer, score) {
    // Store answer in hash
    await client.hSet(`session:${sessionId}:answers`, questionId, answer.toString());
    
    // Increment score counter
    await client.incrBy(`session:${sessionId}:score`, score);
    
    // Update global statistics
    await client.hIncrBy(`stats:question:${questionId}`, answer.toString(), 1);
    
    // Refresh TTL on all session keys
    await client.expire(`session:${sessionId}:answers`, SESSION_TTL);
    await client.expire(`session:${sessionId}:score`, SESSION_TTL);
    await client.expire(`session:${sessionId}:metadata`, SESSION_TTL);
  },

  /**
   * Get session data
   */
  async getSessionData(sessionId) {
    const [answers, score, metadata] = await Promise.all([
      client.hGetAll(`session:${sessionId}:answers`),
      client.get(`session:${sessionId}:score`),
      client.hGetAll(`session:${sessionId}:metadata`)
    ]);

    return {
      answers,
      score: parseInt(score) || 0,
      metadata
    };
  },

  /**
   * Check if session exists
   */
  async sessionExists(sessionId) {
    const exists = await client.exists(`session:${sessionId}:metadata`);
    return exists === 1;
  },

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    const totalSessions = await client.get('stats:total:sessions');
    
    // Get stats for each question
    const questionIds = ['mood', 'energy', 'stress', 'sleep', 'motivation'];
    const questionStats = {};
    
    for (const qId of questionIds) {
      const stats = await client.hGetAll(`stats:question:${qId}`);
      questionStats[qId] = stats;
    }
    
    return {
      totalSessions: parseInt(totalSessions) || 0,
      questionStats
    };
  }
};

module.exports = {
  client,
  sessionHelpers,
  SESSION_TTL
};
