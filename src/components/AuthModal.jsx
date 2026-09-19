import { useState } from 'react'

export default function AuthModal({
  isOpen,
  currentProfile,
  onLoginSuccess,
  onClose,
}) {
  const [username, setUsername] = useState(currentProfile?.username || '')
  const [email, setEmail] = useState(currentProfile?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const quickPresets = ['Mushak_Striker', 'Modak_Master', 'Temple_Ace', 'Ganesha_Fan']

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const trimmedUser = username.trim()
    if (!trimmedUser) {
      setError('Please enter a display name or username.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/players/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, email: email.trim() || undefined }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.player) {
          localStorage.setItem('mushak_player_profile', JSON.stringify(data.player))
          onLoginSuccess?.(data.player)
          return
        }
      }

      // If backend responded with non-ok or no player, use fallback local profile
      const localProfile = {
        id: Date.now(),
        username: trimmedUser,
        email: email.trim() || null,
        stats: { totalMatches: 0, wins: 0, totalPoints: 0, winRate: 0 },
      }
      localStorage.setItem('mushak_player_profile', JSON.stringify(localProfile))
      onLoginSuccess?.(localProfile)
    } catch {
      // Backend unreachable: graceful offline local state fallback
      const offlineProfile = {
        id: Date.now(),
        username: trimmedUser,
        email: email.trim() || null,
        stats: { totalMatches: 0, wins: 0, totalPoints: 0, winRate: 0 },
      }
      localStorage.setItem('mushak_player_profile', JSON.stringify(offlineProfile))
      onLoginSuccess?.(offlineProfile)
    } finally {
      setLoading(false)
    }
  }

  const handleGuestPlay = () => {
    const randomGuest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`
    setUsername(randomGuest)
    const guestProfile = {
      id: Date.now(),
      username: randomGuest,
      email: null,
      stats: { totalMatches: 0, wins: 0, totalPoints: 0, winRate: 0 },
    }
    localStorage.setItem('mushak_player_profile', JSON.stringify(guestProfile))
    onLoginSuccess?.(guestProfile)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <div className="modal-badge">🐀 GANESHA VOLLEYBALL 🏐</div>
        <h2 className="modal-title">PLAYER SIGN-IN</h2>
        <p className="modal-subtitle">
          Enter your champion name to track match wins and climb the sacred leaderboard!
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username" className="form-label">
              DISPLAY NAME / USERNAME <span className="required-star">*</span>
            </label>
            <input
              id="auth-username"
              type="text"
              className="form-input"
              placeholder="e.g. Mushak_Warrior"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={24}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">
              EMAIL / PLAYER ID <span className="optional-label">(Optional)</span>
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="player@temple.game"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="quick-presets">
            <span className="preset-label">Quick Names:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className="preset-chip"
                onClick={() => setUsername(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="modal-actions auth-actions">
            <button
              type="submit"
              className="action-btn resume-btn"
              disabled={loading}
            >
              {loading ? 'ENTERING COURT...' : 'ENTER COURT & PLAY'}
            </button>
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={handleGuestPlay}
            >
              PLAY AS GUEST
            </button>
            {currentProfile && (
              <button
                type="button"
                className="action-btn text-close-btn"
                onClick={onClose}
              >
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
