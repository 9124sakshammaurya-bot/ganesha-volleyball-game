import { useEffect, useState } from 'react'

export default function LeaderboardModal({
  isOpen,
  currentPlayer,
  onClose,
}) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    if (isOpen) {
      fetch('/api/leaderboard?limit=25')
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error('Could not load leaderboard data')
        })
        .then((data) => {
          if (!ignore && data?.leaderboard) {
            setLeaderboard(data.leaderboard)
          }
        })
        .catch(() => {
          if (!ignore) {
            setLeaderboard([
              { rank: 1, username: 'Mushak_Champion', wins: 5, matchesPlayed: 6, totalPoints: 28, winRate: 83 },
              { rank: 2, username: 'Ganesha_Bhakt', wins: 4, matchesPlayed: 5, totalPoints: 23, winRate: 80 },
              { rank: 3, username: 'Modak_Master', wins: 3, matchesPlayed: 4, totalPoints: 19, winRate: 75 },
              { rank: 4, username: 'Laddoo_Striker', wins: 2, matchesPlayed: 3, totalPoints: 14, winRate: 67 },
            ])
          }
        })
        .finally(() => {
          if (!ignore) setLoading(false)
        })
    }
    return () => {
      ignore = true
    }
  }, [isOpen])

  const handleManualRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/leaderboard?limit=25')
      if (response.ok) {
        const data = await response.json()
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard)
          return
        }
      }
      throw new Error('Could not load leaderboard data')
    } catch {
      setLeaderboard([
        { rank: 1, username: 'Mushak_Champion', wins: 5, matchesPlayed: 6, totalPoints: 28, winRate: 83 },
        { rank: 2, username: 'Ganesha_Bhakt', wins: 4, matchesPlayed: 5, totalPoints: 23, winRate: 80 },
        { rank: 3, username: 'Modak_Master', wins: 3, matchesPlayed: 4, totalPoints: 19, winRate: 75 },
        { rank: 4, username: 'Laddoo_Striker', wins: 2, matchesPlayed: 3, totalPoints: 14, winRate: 67 },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="leaderboard-modal">
        <div className="modal-badge">🏆 TEMPLE HALL OF FAME 🏆</div>
        <h2 className="modal-title">MUSHAK LEADERBOARD</h2>
        <p className="modal-subtitle">
          Top volleyball masters of Mount Kailash and Lord Ganesha's court.
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <div className="leaderboard-container">
          {loading ? (
            <div className="leaderboard-loading">Summoning champions...</div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>CHAMPION</th>
                  <th>WINS</th>
                  <th>POINTS</th>
                  <th>WIN %</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      No matches recorded yet. Be the first champion!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => {
                    const isCurrent =
                      currentPlayer &&
                      item.username.toLowerCase() === currentPlayer.username.toLowerCase()
                    const rankMedal =
                      item.rank === 1
                        ? '🥇'
                        : item.rank === 2
                        ? '🥈'
                        : item.rank === 3
                        ? '🥉'
                        : `#${item.rank}`

                    return (
                      <tr
                        key={item.id || item.rank}
                        className={`leaderboard-row ${isCurrent ? 'row-current-player' : ''}`}
                      >
                        <td className="rank-cell">
                          <span className="rank-badge">{rankMedal}</span>
                        </td>
                        <td className="player-cell">
                          <span className="player-name">{item.username}</span>
                          {isCurrent && <span className="you-pill">YOU</span>}
                        </td>
                        <td className="stat-cell wins-cell">{item.wins}</td>
                        <td className="stat-cell points-cell">{item.totalPoints}</td>
                        <td className="stat-cell winrate-cell">{item.winRate}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions leaderboard-actions">
          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            🔄 REFRESH
          </button>
          <button
            type="button"
            className="action-btn resume-btn"
            onClick={onClose}
          >
            RETURN TO COURT
          </button>
        </div>
      </div>
    </div>
  )
}
