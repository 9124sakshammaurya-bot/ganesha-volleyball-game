import process from 'node:process'
import express from 'express'
import cors from 'cors'
import { findOrCreatePlayer, getLeaderboard, saveScore } from './db.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// POST /api/players/login - Create or retrieve a player profile
app.post('/api/players/login', (req, res) => {
  try {
    const { username, email } = req.body || {}
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' })
    }

    const player = findOrCreatePlayer(username, email)
    return res.json({ success: true, player })
  } catch (err) {
    console.error('Error during player login:', err)
    return res.status(500).json({ error: 'Internal server error during login.' })
  }
})

// POST /api/scores - Save player match results upon game completion
app.post('/api/scores', (req, res) => {
  try {
    const {
      playerId,
      username,
      playerScore,
      opponentScore,
      targetScore,
      won,
      difficulty,
    } = req.body || {}

    if (playerScore === undefined || opponentScore === undefined) {
      return res.status(400).json({ error: 'playerScore and opponentScore are required.' })
    }

    const result = saveScore({
      playerId,
      username: username || 'Player',
      playerScore,
      opponentScore,
      targetScore,
      won,
      difficulty,
    })

    return res.json({ success: true, ...result })
  } catch (err) {
    console.error('Error saving score:', err)
    return res.status(500).json({ error: 'Internal server error while saving score.' })
  }
})

// GET /api/leaderboard - Retrieve top player scores and statistics
app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))
    const leaderboard = getLeaderboard(limit)
    return res.json({ success: true, leaderboard })
  } catch (err) {
    console.error('Error fetching leaderboard:', err)
    return res.status(500).json({ error: 'Internal server error while fetching leaderboard.' })
  }
})

app.listen(PORT, () => {
  console.log(`[Ganesha Volleyball API] Server running on http://localhost:${PORT}`)
})

export default app
