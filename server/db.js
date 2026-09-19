import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'volleyball.db')
const db = new DatabaseSync(dbPath)

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    player_username TEXT NOT NULL,
    player_score INTEGER NOT NULL,
    opponent_score INTEGER NOT NULL,
    target_score INTEGER NOT NULL,
    won INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`)

// Seed initial leaderboard entries if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM players')
const { count } = countStmt.get()

if (count === 0) {
  const seedPlayers = [
    { username: 'Mushak_Champion', email: 'champion@mushak.game', wins: 5, matches: 6, points: 28 },
    { username: 'Ganesha_Bhakt', email: 'bhakt@ganesha.game', wins: 4, matches: 5, points: 23 },
    { username: 'Modak_Master', email: 'modak@temple.game', wins: 3, matches: 4, points: 19 },
    { username: 'Laddoo_Striker', email: 'striker@temple.game', wins: 2, matches: 3, points: 14 },
  ]

  const insertPlayerStmt = db.prepare('INSERT INTO players (username, email) VALUES (?, ?)')
  const insertScoreStmt = db.prepare(`
    INSERT INTO scores (player_id, player_username, player_score, opponent_score, target_score, won, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (const sp of seedPlayers) {
    const result = insertPlayerStmt.run(sp.username, sp.email)
    const playerId = result.lastInsertRowid
    for (let i = 0; i < sp.matches; i++) {
      const isWin = i < sp.wins ? 1 : 0
      insertScoreStmt.run(
        playerId,
        sp.username,
        isWin ? 5 : 3,
        isWin ? 3 : 5,
        5,
        isWin,
        'medium'
      )
    }
  }
}

/**
 * Find player by username or create a new one.
 * Returns player record with computed statistics.
 */
export function findOrCreatePlayer(username, email = null) {
  const cleanUsername = (username || 'Player').trim()
  const cleanEmail = email ? email.trim() : null

  let getStmt = db.prepare('SELECT * FROM players WHERE username = ? COLLATE NOCASE')
  let player = getStmt.get(cleanUsername)

  if (!player) {
    const insertStmt = db.prepare('INSERT INTO players (username, email) VALUES (?, ?)')
    const result = insertStmt.run(cleanUsername, cleanEmail)
    player = { id: Number(result.lastInsertRowid), username: cleanUsername, email: cleanEmail }
  } else if (cleanEmail && !player.email) {
    const updateStmt = db.prepare('UPDATE players SET email = ? WHERE id = ?')
    updateStmt.run(cleanEmail, player.id)
    player.email = cleanEmail
  }

  // Attach player stats
  const statsStmt = db.prepare(`
    SELECT
      COUNT(id) as total_matches,
      COALESCE(SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(player_score), 0) as total_points,
      COALESCE(MAX(player_score), 0) as high_score
    FROM scores
    WHERE player_id = ?
  `)
  const stats = statsStmt.get(player.id)

  const matches = stats ? Number(stats.total_matches) : 0
  const wins = stats ? Number(stats.wins) : 0
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0

  return {
    id: player.id,
    username: player.username,
    email: player.email,
    stats: {
      totalMatches: matches,
      wins,
      totalPoints: stats ? Number(stats.total_points) : 0,
      highScore: stats ? Number(stats.high_score) : 0,
      winRate,
    },
  }
}

/**
 * Save a match score and return updated stats.
 */
export function saveScore({
  playerId,
  username,
  playerScore,
  opponentScore,
  targetScore = 5,
  won = false,
  difficulty = 'medium',
}) {
  let pId = playerId
  const pName = (username || 'Player').trim()

  if (!pId) {
    const player = findOrCreatePlayer(pName)
    pId = player.id
  }

  const insertScore = db.prepare(`
    INSERT INTO scores (player_id, player_username, player_score, opponent_score, target_score, won, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const wonInt = won ? 1 : 0
  const result = insertScore.run(
    pId,
    pName,
    Number(playerScore) || 0,
    Number(opponentScore) || 0,
    Number(targetScore) || 5,
    wonInt,
    difficulty || 'medium'
  )

  const updatedPlayer = findOrCreatePlayer(pName)

  return {
    scoreId: Number(result.lastInsertRowid),
    saved: true,
    player: updatedPlayer,
  }
}

/**
 * Retrieve the top players leaderboard.
 */
export function getLeaderboard(limit = 20) {
  const leaderboardStmt = db.prepare(`
    SELECT
      p.id,
      p.username,
      COUNT(s.id) as matches_played,
      COALESCE(SUM(CASE WHEN s.won = 1 THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(s.player_score), 0) as total_points,
      COALESCE(MAX(s.player_score), 0) as high_score,
      ROUND(CAST(COALESCE(SUM(CASE WHEN s.won = 1 THEN 1 ELSE 0 END), 0) AS FLOAT) / MAX(COUNT(s.id), 1) * 100, 0) as win_rate
    FROM players p
    JOIN scores s ON p.id = s.player_id
    GROUP BY p.id
    ORDER BY wins DESC, total_points DESC, win_rate DESC
    LIMIT ?
  `)

  const rows = leaderboardStmt.all(limit)
  return rows.map((row, idx) => ({
    rank: idx + 1,
    id: row.id,
    username: row.username,
    matchesPlayed: Number(row.matches_played),
    wins: Number(row.wins),
    totalPoints: Number(row.total_points),
    highScore: Number(row.high_score),
    winRate: Number(row.win_rate),
  }))
}

export default db
