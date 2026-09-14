export default function Hud() {
  return (
    <div className="hud">
      <p className="hud-title">MUSHAK VOLLEYBALL</p>
      <div className="scoreboard" aria-label="Score">
        <span className="score-side">PLAYER</span>
        <span className="score-value">0 : 0</span>
        <span className="score-side">COMPUTER</span>
      </div>
    </div>
  )
}
