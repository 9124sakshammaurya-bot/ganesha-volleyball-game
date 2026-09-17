export default function Hud({
  playerScore = 0,
  opponentScore = 0,
  matchState = 'playing',
  roundMessage = null,
  winner = null,
  difficulty = 'medium',
  onSelectDifficulty,
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
            <span className="score-sub">FIRST TO 5</span>
          </div>
          <span className="score-side opponent-side">COMPUTER</span>
        </div>

        {/* Difficulty Selector Toggle */}
        <div className="difficulty-bar" role="group" aria-label="AI Difficulty">
          <span className="diff-label">AI DIFFICULTY:</span>
          {['easy', 'medium', 'hard'].map((level) => (
            <button
              key={level}
              type="button"
              className={`diff-btn ${difficulty === level ? 'active' : ''}`}
              onClick={() => onSelectDifficulty?.(level)}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Round Toast Announcement */}
        {roundMessage && matchState !== 'gameOver' && (
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
            <kbd>R</kbd> Reset Ball
          </span>
        </div>
      </div>

      {/* Match Over Modal Dialog */}
      {matchState === 'gameOver' && (
        <div className="game-over-overlay">
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
              <span className="final-score-label">FINAL SCORE</span>
              <div className="final-score-digits">
                <span className="player-digit">{playerScore}</span>
                <span className="colon">:</span>
                <span className="opponent-digit">{opponentScore}</span>
              </div>
            </div>
            <button
              type="button"
              className="play-again-btn"
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
