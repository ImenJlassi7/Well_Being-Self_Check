/**
 * Question definitions for mental well-being assessment
 * Each question has a 1-5 scale where:
 * 1 = Very poor/negative
 * 5 = Very good/positive
 */

const questions = [
    {
        id: 'mood',
        question: 'How would you describe your overall mood today?',
        options: [
            { value: 1, label: 'Very low or sad', emoji: '😢' },
            { value: 2, label: 'Somewhat down', emoji: '😔' },
            { value: 3, label: 'Neutral or okay', emoji: '😐' },
            { value: 4, label: 'Pretty good', emoji: '🙂' },
            { value: 5, label: 'Great or happy', emoji: '😊' }
        ]
    },
    {
        id: 'energy',
        question: 'How are your energy levels?',
        options: [
            { value: 1, label: 'Exhausted or drained', emoji: '😴' },
            { value: 2, label: 'Low energy', emoji: '😪' },
            { value: 3, label: 'Moderate energy', emoji: '😌' },
            { value: 4, label: 'Good energy', emoji: '😊' },
            { value: 5, label: 'Very energetic', emoji: '⚡' }
        ]
    },
    {
        id: 'stress',
        question: 'How stressed do you feel?',
        options: [
            { value: 1, label: 'Extremely stressed', emoji: '😰' },
            { value: 2, label: 'Very stressed', emoji: '😟' },
            { value: 3, label: 'Moderately stressed', emoji: '😕' },
            { value: 4, label: 'A little stressed', emoji: '🙂' },
            { value: 5, label: 'Not stressed at all', emoji: '😌' }
        ]
    },
    {
        id: 'sleep',
        question: 'How well did you sleep recently?',
        options: [
            { value: 1, label: 'Very poorly', emoji: '😫' },
            { value: 2, label: 'Not great', emoji: '😴' },
            { value: 3, label: 'Okay', emoji: '😐' },
            { value: 4, label: 'Pretty well', emoji: '🙂' },
            { value: 5, label: 'Very well', emoji: '😊' }
        ]
    },
    {
        id: 'motivation',
        question: 'How motivated do you feel?',
        options: [
            { value: 1, label: 'No motivation', emoji: '😞' },
            { value: 2, label: 'Low motivation', emoji: '😔' },
            { value: 3, label: 'Some motivation', emoji: '😐' },
            { value: 4, label: 'Good motivation', emoji: '🙂' },
            { value: 5, label: 'Very motivated', emoji: '🚀' }
        ]
    }
];

/**
 * Score interpretation ranges
 * Total possible score: 5-25 (5 questions × 1-5 points each)
 */
const scoreRanges = {
    low: { min: 5, max: 10, label: 'Needs Support' },
    moderate: { min: 11, max: 17, label: 'Moderate Well-being' },
    good: { min: 18, max: 25, label: 'Good Well-being' }
};

/**
 * Get score category based on total score
 */
function getScoreCategory(totalScore) {
    if (totalScore >= scoreRanges.good.min) return 'good';
    if (totalScore >= scoreRanges.moderate.min) return 'moderate';
    return 'low';
}

module.exports = {
    questions,
    scoreRanges,
    getScoreCategory
};
