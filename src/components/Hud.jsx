import { TARGET_SCORE_OPTIONS } from '../game/constants'

export default function Hud({
  playerScore = 0,
  opponentScore = 0,
  targetScore = 5,
  matchState = 'playing',
  isPaused = false,
  roundMessage = null,
  winner = null,
  difficulty = 'medium',
  chargeState = { isCharging: false, power: 0 },
  speedState = { speedMultiplier: 0.65, rallyHits: 0 },
  playerProfile = null,
  onOpenAuth,
  onOpenLeaderboard,
  onSelectDifficulty,
  onSelectTargetScore,
  onTogglePause,
  onResumeGame,
  onResetMatch,
}) {
  const currentSpeed = speedState?.speedMultiplier || 0.65
  const rallyHits = speedState?.rallyHits || 0
  const isSpeedSpike = currentSpeed >= 1.15

  return (
    <>
      <div className="hud">
        {/* Top Header Bar: Title, Player Chip & Leaderboard */}
        <div className="hud-top-bar">
          <div className="hud-title-container">
            <p className="hud-title">MUSHAK VOLLEYBALL</p>
          </div>

          <div className="hud-meta-actions">
            {/* Player Profile Chip */}
            <button
              type="button"
              className="player-chip-btn"
              onClick={onOpenAuth}
              title="Click to change player profile"
            >
              <span className="player-chip-avatar">🐀</span>
              <span className="player-chip-name">
                {playerProfile?.username || 'Guest Player'}
              </span>
              <span className="player-chip-badge">Switch</span>
            </button>

            {/* Leaderboard Button */}
            <button
              type="button"
              className="leaderboard-nav-btn"
              onClick={onOpenLeaderboard}
              title="View Hall of Fame Leaderboard"
            >
              🏆 LEADERBOARD
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="scoreboard" aria-label="Score">
          <div className="score-side-container player-side">
            <span className="score-side">
              {playerProfile?.username ? playerProfile.username.toUpperCase() : 'PLAYER'}
            </span>
          </div>

          <div className="score-center">
            <span className="score-value">
              {playerScore} : {opponentScore}
            </span>
            <span className="score-sub">FIRST TO {targetScore}</span>
          </div>

          <div className="score-side-container opponent-side">
            <span className="score-side">COMPUTER</span>
          </div>
        </div>

        {/* Match Settings & Options Bar */}
        <div className="settings-bar" role="group" aria-label="Match Settings">
          {/* Live Ball Speed Ramp Indicator */}
          <div
            className={`speed-ramp-badge ${isSpeedSpike ? 'speed-hot' : ''}`}
            title="Ball speed ramps smoothly with each rally hit!"
          >
            <span className="speed-icon">{isSpeedSpike ? '🔥' : '⚡'}</span>
            <span className="speed-text">SPEED: {currentSpeed.toFixed(2)}x</span>
            {rallyHits > 0 && <span className="speed-hits">({rallyHits} hits)</span>}
          </div>

          <div className="settings-divider" />

          {/* Difficulty Selector Toggle */}
          <div className="setting-group" aria-label="AI Difficulty">
            <span className="setting-label">AI:</span>
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                type="button"
                className={`pill-btn ${difficulty === level ? 'active' : ''}`}
                onClick={() => onSelectDifficulty?.(level)}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="settings-divider" />

          {/* Match Target Score Selector */}
          <div className="setting-group" aria-label="Target Score">
            <span className="setting-label">TARGET:</span>
            {TARGET_SCORE_OPTIONS.map((score) => (
              <button
                key={score}
                type="button"
                className={`pill-btn ${targetScore === score ? 'active' : ''}`}
                onClick={() => onSelectTargetScore?.(score)}
              >
                {score}
              </button>
            ))}
          </div>

          <div className="settings-divider" />

          {/* Pause Button */}
          <button
            type="button"
            className={`pause-btn ${isPaused ? 'active' : ''}`}
            onClick={() => onTogglePause?.()}
            title="Pause Game (P or Esc)"
          >
            {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        </div>

        {/* Round Toast Announcement */}
        {roundMessage && matchState !== 'gameOver' && !isPaused && (
          <div
            className={`round-toast ${
              roundMessage.includes('PLAYER')
                ? 'toast-player'
                : roundMessage.includes('COMPUTER')
                ? 'toast-opponent'
                : 'toast-neutral'
            }`}
          >
            {roundMessage}
          </div>
        )}

        {/* Serve Power Charge Meter (active when holding space to serve) */}
        {chargeState?.isCharging && (
          <div
            className="charge-meter-container"
            role="progressbar"
            aria-valuenow={Math.round(chargeState.power * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="charge-meter-header">
              <span className="charge-label">SERVE POWER</span>
              <span
                className={`charge-tier-badge ${
                  chargeState.power >= 0.75
                    ? 'tier-smash'
                    : chargeState.power >= 0.4
                    ? 'tier-volley'
                    : 'tier-lob'
                }`}
              >
                {chargeState.power >= 0.75
                  ? '⚡ DEEP DRIVE!'
                  : chargeState.power >= 0.4
                  ? 'MEDIUM SERVE'
                  : 'SHORT SERVE'}
              </span>
            </div>
            <div className="charge-meter-track">
              <div
                className={`charge-meter-fill ${chargeState.power >= 0.75 ? 'fill-max' : ''}`}
                style={{ width: `${Math.max(6, Math.round(chargeState.power * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls Quick Reference */}
        <div className="hud-controls" aria-label="Game Controls">
          <span className="control-item">
            <kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd> Move & Aim
          </span>
          <span className="control-item">
            <kbd>W</kbd><kbd>S</kbd> / <kbd>↑</kbd><kbd>↓</kbd> Court Depth
          </span>
          <span className="control-item control-highlight">
            <kbd>AUTO-HIT</kbd> Step into Landing Reticle to Hit!
          </span>
          <span className="control-item">
            <kbd>SPACE</kbd> Serve / Jump
          </span>
          <span className="control-item">
            <kbd>P</kbd> Pause
          </span>
          <span className="control-item">
            <kbd>R</kbd> Reset
          </span>
        </div>
      </div>

      {/* Pause Modal Dialog */}
      {isPaused && matchState !== 'gameOver' && (
        <div className="modal-overlay">
          <div className="pause-modal">
            <div className="modal-badge">⏸ GAME PAUSED ⏸</div>
            <h2 className="modal-title">MATCH PAUSED</h2>
            <p className="modal-subtitle">Take a breath, warrior of Ganesha!</p>

            <div className="final-score-box">
              <span className="final-score-label">CURRENT SCORE (FIRST TO {targetScore})</span>
              <div className="final-score-digits">
                <span className="player-digit">{playerScore}</span>
                <span className="colon">:</span>
                <span className="opponent-digit">{opponentScore}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="action-btn resume-btn"
                onClick={() => onResumeGame?.()}
              >
                RESUME MATCH
              </button>
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={() => onResetMatch?.()}
              >
                RESTART MATCH
              </button>
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onOpenLeaderboard}
              >
                🏆 LEADERBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Over Modal Dialog */}
      {matchState === 'gameOver' && (
        <div className="modal-overlay">
          <div className="game-over-modal">
            <div className="modal-badge">
              {winner === 'player' ? '🏆 VICTORY 🏆' : '⚡ MATCH COMPLETE ⚡'}
            </div>
            <h2 className={`game-over-title ${winner === 'player' ? 'title-win' : 'title-lose'}`}>
              {winner === 'player' ? 'YOU WON THE MATCH!' : 'COMPUTER WINS!'}
            </h2>
            <p className="game-over-subtitle">
              {winner === 'player'
                ? `Masterful volleying, ${playerProfile?.username || 'Player'}! The divine Modak is secured!`
                : 'A valiant effort! Computer Mushak takes the game.'}
            </p>
            <div className="final-score-box">
              <span className="final-score-label">FINAL SCORE (FIRST TO {targetScore})</span>
              <div className="final-score-digits">
                <span className="player-digit">{playerScore}</span>
                <span className="colon">:</span>
                <span className="opponent-digit">{opponentScore}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="action-btn resume-btn"
                onClick={() => onResetMatch?.()}
              >
                PLAY AGAIN
              </button>
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onOpenLeaderboard}
              >
                🏆 VIEW LEADERBOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
