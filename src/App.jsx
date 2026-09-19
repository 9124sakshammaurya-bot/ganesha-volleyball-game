import { useState, useEffect, useRef } from 'react'
import GameScene from './components/GameScene'
import Hud from './components/Hud'
import AuthModal from './components/AuthModal'
import LeaderboardModal from './components/LeaderboardModal'
import { useGameLoop } from './game/useGameLoop'
import './App.css'

function App() {
  const {
    playerScore,
    opponentScore,
    targetScore,
    matchState,
    isPaused,
    roundMessage,
    winner,
    difficulty,
    concedingSide,
    serverSide,
    roundId,
    onBallGrounded,
    onServeTriggered,
    togglePause,
    resumeGame,
    restartMatch,
    setDifficulty,
    setTargetScore,
  } = useGameLoop()

  // Spacebar serve power state
  const [chargeState, setChargeState] = useState({ isCharging: false, power: 0 })

  // Live speed ramp state
  const [speedState, setSpeedState] = useState({ speedMultiplier: 0.65, rallyHits: 0 })

  // Player Profile State & Persistence
  const [playerProfile, setPlayerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('mushak_player_profile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Modal Dialogs
  const [showAuthModal, setShowAuthModal] = useState(!playerProfile)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)

  // Track if current match result has already been submitted to avoid duplicate submissions
  const submittedMatchRef = useRef(false)

  // When round resets, reset submission flag
  useEffect(() => {
    if (matchState === 'serving' || matchState === 'playing') {
      submittedMatchRef.current = false
    }
  }, [matchState, roundId])

  // Automatically submit match results when game over condition is met
  useEffect(() => {
    if (matchState === 'gameOver' && winner && !submittedMatchRef.current) {
      submittedMatchRef.current = true

      const payload = {
        playerId: playerProfile?.id || null,
        username: playerProfile?.username || 'Player',
        playerScore,
        opponentScore,
        targetScore,
        won: winner === 'player',
        difficulty,
      }

      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.player) {
            setPlayerProfile(data.player)
            localStorage.setItem('mushak_player_profile', JSON.stringify(data.player))
          }
        })
        .catch((err) => {
          console.warn('Unable to persist score to remote API:', err)
        })
    }
  }, [matchState, winner, playerScore, opponentScore, targetScore, difficulty, playerProfile])

  const handleLoginSuccess = (profile) => {
    setPlayerProfile(profile)
    setShowAuthModal(false)
  }

  return (
    <div className="app">
      <Hud
        playerScore={playerScore}
        opponentScore={opponentScore}
        targetScore={targetScore}
        matchState={matchState}
        isPaused={isPaused}
        roundMessage={roundMessage}
        winner={winner}
        difficulty={difficulty}
        chargeState={chargeState}
        speedState={speedState}
        playerProfile={playerProfile}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onSelectDifficulty={setDifficulty}
        onSelectTargetScore={setTargetScore}
        onTogglePause={togglePause}
        onResumeGame={resumeGame}
        onResetMatch={restartMatch}
      />

      <GameScene
        matchState={matchState}
        isPaused={isPaused}
        playerScore={playerScore}
        difficulty={difficulty}
        concedingSide={concedingSide}
        serverSide={serverSide}
        roundId={roundId}
        onBallGrounded={onBallGrounded}
        onServeTriggered={onServeTriggered}
        onChargeUpdate={setChargeState}
        onSpeedUpdate={setSpeedState}
        onResetMatch={restartMatch}
        onTogglePause={togglePause}
      />

      <AuthModal
        isOpen={showAuthModal}
        currentProfile={playerProfile}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setShowAuthModal(false)}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        currentPlayer={playerProfile}
        onClose={() => setShowLeaderboardModal(false)}
      />
    </div>
  )
}

export default App
