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
  onSelectDifficulty,
  onSelectTargetScore,
  onTogglePause,
  onResumeGame,
  onResetMatch,
}) {
  return (
    <>
      <div className="hud">
        <p className="hud-title">MUSHAK VOLLEYBALL</p>

        {/* Scoreboard */}
        <div className="scoreboard" aria-label="Score">
          <span className="score-side player-side">PLAYER</span>
          <div className="score-center">
            <span className="score-value">
              {playerScore} : {opponentScore}
            </span>
            <span className="score-sub">FIRST TO {targetScore}</span>
          </div>
          <span className="score-side opponent-side">COMPUTER</span>
        </div>

        {/* Match Settings & Options Bar */}
        <div className="settings-bar" role="group" aria-label="Match Settings">
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

        {/* Controls Quick Reference */}
        <div className="hud-controls" aria-label="Game Controls">
          <span className="control-item">
            <kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> Move
          </span>
          <span className="control-item">
            <kbd>W</kbd><kbd>S</kbd> or <kbd>↑</kbd><kbd>↓</kbd> Depth
          </span>
          <span className="control-item control-highlight">
            <kbd>SPACE</kbd> Jump / Hit Modak
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
                ? 'Masterful volleying! The divine Modak is secured!'
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
            <button
              type="button"
              className="action-btn resume-btn"
              onClick={() => onResetMatch?.()}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </>
  )
}
