const { getScoreCategory } = require('./questions');

/**
 * Generate personalized advice based on user's answers and total score
 * This uses rule-based logic instead of AI to provide supportive, ethical guidance
 */

// Main advice messages based on score category
const categoryAdvice = {
    //Premier scenario
    low: {
        title: 'We hear you <i class="fas fa-heart" style="color: #667eea;"></i>',
        message: 'It looks like you might be going through a challenging time right now. That\'s okay - everyone experiences difficult periods. Remember that reaching out for support is a sign of strength, not weakness.',
        action: 'Consider talking to a mental health professional, trusted friend, or family member. You don\'t have to face this alone.'
    },
    moderate: {
        title: 'You\'re doing okay <i class="fas fa-star" style="color: #f093fb;"></i>',
        message: 'Your well-being seems to be in a moderate range. There might be some areas where you could use a little extra support or self-care.',
        action: 'Focus on the areas that need attention and celebrate the things that are going well. Small, consistent steps can make a big difference.'
    },
    good: {
        title: 'You\'re doing great! <i class="fas fa-wand-magic-sparkles" style="color: #00f2fe;"></i>',
        message: 'Your responses suggest you\'re in a good place right now. That\'s wonderful! Keep up the positive habits that are supporting your well-being.',
        action: 'Continue nurturing your mental health with the practices that work for you. Remember to check in with yourself regularly.'
    }
};

// Specific tips based on individual question responses
const specificTips = {
    mood: {
        low: '😢 **Mood Support**: Try activities that usually bring you joy, even if you don\'t feel like it at first. Sometimes action precedes motivation.',
        moderate: '😔 **Mood Boost**: Consider journaling your thoughts or spending time in nature to help lift your spirits.',
        good: '😊 **Mood Maintenance**: Keep doing what\'s working! Gratitude practices can help maintain positive mood.'
    },
    energy: {
        low: '😴 **Energy Support**: Prioritize rest and gentle movement. Even a short walk can help. Check if you\'re getting enough nutrients and hydration.',
        moderate: '😌 **Energy Boost**: Balance activity with rest. Consider your sleep schedule and whether you\'re taking regular breaks.',
        good: '⚡ **Energy Maintenance**: Great energy levels! Keep up your healthy routines and listen to your body\'s needs.'
    },
    stress: {
        low: '😰 **Stress Management**: High stress needs attention. Try deep breathing, meditation, or talking to someone. Break tasks into smaller steps.',
        moderate: '😕 **Stress Reduction**: Identify your main stressors and see which ones you can address. Regular relaxation practices can help.',
        good: '😌 **Stress Prevention**: You\'re managing stress well! Continue your coping strategies and maintain healthy boundaries.'
    },
    sleep: {
        low: '😫 **Sleep Support**: Poor sleep affects everything. Try a consistent bedtime routine, limit screens before bed, and create a calm sleep environment.',
        moderate: '😴 **Sleep Improvement**: Focus on sleep hygiene - regular schedule, cool dark room, and relaxing pre-bed routine.',
        good: '😊 **Sleep Maintenance**: Excellent sleep! This is foundational to your well-being. Keep your good sleep habits.'
    },
    motivation: {
        low: '😞 **Motivation Support**: Low motivation is common during tough times. Start with tiny, achievable goals. Celebrate small wins.',
        moderate: '😐 **Motivation Boost**: Set clear, meaningful goals. Break them into small steps and track your progress.',
        good: '🚀 **Motivation Maintenance**: Your motivation is strong! Channel it into meaningful activities and goals that align with your values.'
    }
};

/**
 * Generate comprehensive advice based on all user data
 */
function generateAdvice(answers, totalScore) {
    const category = getScoreCategory(totalScore);
    const advice = {
        score: totalScore,
        category: category,
        categoryLabel: getCategoryLabel(category),
        mainAdvice: categoryAdvice[category],
        specificTips: [],
        resources: getResources(category)
    };

    // Add specific tips based on individual answers
    for (const [questionId, answerValue] of Object.entries(answers)) {
        const value = parseInt(answerValue);
        const tipCategory = getTipCategory(value);

        if (specificTips[questionId] && specificTips[questionId][tipCategory]) {
            advice.specificTips.push(specificTips[questionId][tipCategory]);
        }
    }

    return advice;
}

/**
 * Get category label for display
 */
function getCategoryLabel(category) {
    const labels = {
        low: 'Needs Support',
        moderate: 'Moderate Well-being',
        good: 'Good Well-being'
    };
    return labels[category];
}

/**
 * Convert numeric answer to tip category
 */
function getTipCategory(value) {
    if (value <= 2) return 'low';
    if (value <= 3) return 'moderate';
    return 'good';
}

/**
 * Get helpful resources based on category
 */
function getResources(category) {
    const allResources = [
        {
            name: 'Crisis Support',
            description: 'If you\'re in crisis, please reach out immediately',
            urgent: true
        },
        {
            name: 'Mental Health Professional',
            description: 'Consider speaking with a therapist or counselor',
            urgent: category === 'low'
        },
        {
            name: 'Self-Care Practices',
            description: 'Regular exercise, healthy eating, and good sleep hygiene',
            urgent: false
        },
        {
            name: 'Mindfulness & Meditation',
            description: 'Apps and practices for stress reduction and awareness',
            urgent: false
        }
    ];

    // Filter resources based on category
    if (category === 'low') {
        return allResources.filter(r => r.urgent);
    } else if (category === 'moderate') {
        return allResources.slice(1, 3);
    } else {
        return allResources.slice(2);
    }
}

module.exports = {
    generateAdvice
};
