const pool = require('./db');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

// Helper to load rules (keeping rules as static config for now)
const loadJSON = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));

class PersonalizationEngine {
    constructor() {
        this.rules = loadJSON('rules.json');
    }

    /**
     * Generates a personalized learning path for a user
     * @param {Object} userProfile - { learningStyle: 'visual', pacing: 'fast', currentLevel: 1 }
     */
    async generatePath(userProfile) {
        // Fetch All Units from DB
        const [rows] = await pool.query('SELECT * FROM units');
        let recommendedUnits = rows;

        // Filter by difficulty
        recommendedUnits = recommendedUnits.filter(u => u.difficulty >= userProfile.currentLevel);

        // Sort/Score based on Learning Style
        const styleRules = this.rules.learning_styles[userProfile.learningStyle];
        if (styleRules) {
            recommendedUnits = recommendedUnits.map(unit => {
                let score = 0;
                // Parse tags if they come as string from DB (depending on driver/type)
                let tags = unit.tags;
                if (typeof tags === 'string') {
                    try { tags = JSON.parse(tags); } catch (e) { tags = []; }
                }

                // Boost for preferred tags
                if (tags && tags.some(t => styleRules.boost_tags.includes(t))) score += 5;
                // Penalty for disliked tags
                if (tags && tags.some(t => styleRules.penalty_tags.includes(t))) score -= 2;

                return { ...unit, score };
            }).sort((a, b) => b.score - a.score);
        }

        // Apply Pacing
        const pacingMultiplier = this.rules.pacing_multipliers[userProfile.pacing] || 1;
        const limit = Math.ceil(this.rules.default_path_length * pacingMultiplier);

        return recommendedUnits.slice(0, limit);
    }
}

module.exports = new PersonalizationEngine();
