/**
 * Opponent AI Difficulty Profiles & Progressive Hardening
 */

export const DIFFICULTY_PRESETS = {
  easy: {
    name: 'Easy',
    speed: 4.6,
    reactionLerp: 4.2, // Slower human-like tracking
    errorMargin: 0.42,  // Occasional slight positioning error
    jumpThresholdY: 2.3,
    aimVariance: 1.8,
  },
  medium: {
    name: 'Medium',
    speed: 6.2,
    reactionLerp: 7.5,
    errorMargin: 0.18,
    jumpThresholdY: 2.55,
    aimVariance: 1.1,
  },
  hard: {
    name: 'Hard',
    speed: 8.0,
    reactionLerp: 12.0, // Sharp tracking
    errorMargin: 0.05,
    jumpThresholdY: 2.75,
    aimVariance: 0.5,
  },
}

/**
 * Dynamically scales AI difficulty as player score increases in the match.
 * Adds +5% speed and responsiveness per point won by the player (capped at +30%).
 */
export function getScaledAIDifficulty(presetKey = 'medium', playerScore = 0) {
  const base = DIFFICULTY_PRESETS[presetKey] || DIFFICULTY_PRESETS.medium
  const scalingFactor = 1 + Math.min(0.3, Math.max(0, playerScore) * 0.05)

  return {
    ...base,
    speed: base.speed * scalingFactor,
    reactionLerp: base.reactionLerp * scalingFactor,
    // Error margin decreases as AI hardens
    errorMargin: Math.max(0.02, base.errorMargin / scalingFactor),
    scalingFactor,
  }
}
