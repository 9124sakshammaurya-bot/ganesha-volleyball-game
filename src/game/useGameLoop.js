import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DEFAULT_TARGET_SCORE,
  IN_BOUNDS_TOLERANCE_X,
  IN_BOUNDS_TOLERANCE_Z,
} from './constants'

/**
 * Custom hook managing the arcade Volleyball match game loop:
 * - Scores, configurable win target (3, 5, 7, 11), and game over state
 * - Out-of-bounds detection with last-hitter attribution
 * - Pause / Resume system
 * - Round transitions (pause on score, serve drops)
 * - Difficulty presets (Easy, Medium, Hard)
 */
export function useGameLoop() {
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE)
  const [matchState, setMatchState] = useState('serving') // 'serving' | 'playing' | 'scored' | 'gameOver'
  const [isPaused, setIsPaused] = useState(false)
  const [roundMessage, setRoundMessage] = useState('READY TO SERVE (HOLD SPACE)')
  const [winner, setWinner] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [concedingSide, setConcedingSide] = useState('opponent')
  const [serverSide, setServerSide] = useState('player')
  const [roundId, setRoundId] = useState(1)

  // Ref to hold latest state for use inside callbacks without stale closures
  const stateRef = useRef({
    playerScore,
    opponentScore,
    targetScore,
    matchState,
    isPaused,
    difficulty,
    serverSide,
  })

  useEffect(() => {
    stateRef.current = {
      playerScore,
      opponentScore,
      targetScore,
      matchState,
      isPaused,
      difficulty,
      serverSide,
    }
  }, [playerScore, opponentScore, targetScore, matchState, isPaused, difficulty, serverSide])

  const timerRef = useRef(null)

  const clearPendingTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Triggered when the Modak touches the floor anywhere
  const onBallGrounded = useCallback((ballX, ballZ, lastHitter) => {
    const {
      matchState: currentMatchState,
      isPaused: currentPaused,
      playerScore: pScore,
      opponentScore: oScore,
      targetScore: currentTarget,
    } = stateRef.current

    if (currentMatchState !== 'playing' || currentPaused) return

    clearPendingTimers()

    // 1. Check if the ball landed IN BOUNDS or OUT OF BOUNDS
    const isInBounds =
      Math.abs(ballX) <= IN_BOUNDS_TOLERANCE_X &&
      Math.abs(ballZ) <= IN_BOUNDS_TOLERANCE_Z

    let scoringSide
    let pointMessage

    if (!isInBounds) {
      // --- OUT OF BOUNDS HIT ---
      // Whoever hit it out concedes the point
      if (lastHitter === 'player') {
        scoringSide = 'opponent'
        pointMessage = 'OUT! POINT FOR COMPUTER!'
        setConcedingSide('player')
      } else if (lastHitter === 'opponent') {
        scoringSide = 'player'
        pointMessage = 'OUT! POINT FOR PLAYER!'
        setConcedingSide('opponent')
      } else {
        // Fallback if untouched
        if (ballZ > 0) {
          scoringSide = 'opponent'
          pointMessage = 'OUT! POINT FOR COMPUTER!'
          setConcedingSide('player')
        } else {
          scoringSide = 'player'
          pointMessage = 'OUT! POINT FOR PLAYER!'
          setConcedingSide('opponent')
        }
      }
    } else {
      // --- IN BOUNDS HIT ---
      // Standard volleyball side attribution:
      // Lands on Player's court (Z > 0) -> Opponent scores
      // Lands on Opponent's court (Z <= 0) -> Player scores
      if (ballZ > 0) {
        scoringSide = 'opponent'
        pointMessage = 'POINT FOR COMPUTER!'
        setConcedingSide('player')
      } else {
        scoringSide = 'player'
        pointMessage = 'POINT FOR PLAYER!'
        setConcedingSide('opponent')
      }
    }

    // 2. Award point & evaluate match win condition
    if (scoringSide === 'player') {
      const nextScore = pScore + 1
      setPlayerScore(nextScore)
      setServerSide('player')

      if (nextScore >= currentTarget) {
        setWinner('player')
        setMatchState('gameOver')
        setRoundMessage('VICTORY! YOU WIN!')
      } else {
        setMatchState('scored')
        setRoundMessage(pointMessage)

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('READY TO SERVE (HOLD SPACE)')
          setRoundId((prev) => prev + 1)
        }, 1250)
      }
    } else {
      const nextScore = oScore + 1
      setOpponentScore(nextScore)
      setServerSide('opponent')

      if (nextScore >= currentTarget) {
        setWinner('opponent')
        setMatchState('gameOver')
        setRoundMessage('COMPUTER WINS!')
      } else {
        setMatchState('scored')
        setRoundMessage(pointMessage)

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('OPPONENT READY TO SERVE...')
          setRoundId((prev) => prev + 1)
        }, 1250)
      }
    }
  }, [])

  // Transition from serving to active rally
  const onServeTriggered = useCallback(() => {
    setMatchState('playing')
    setRoundMessage(null)
  }, [])

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (stateRef.current.matchState === 'gameOver') return
    setIsPaused((prev) => !prev)
  }, [])

  const resumeGame = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Start fresh match
  const restartMatch = useCallback(() => {
    clearPendingTimers()
    setIsPaused(false)
    setPlayerScore(0)
    setOpponentScore(0)
    setWinner(null)
    setConcedingSide('opponent')
    setServerSide('player')
    setMatchState('serving')
    setRoundMessage('READY TO SERVE (HOLD SPACE)')
    setRoundId((prev) => prev + 1)
  }, [])

  // Change difficulty
  const handleSetDifficulty = useCallback((newDiff) => {
    setDifficulty(newDiff)
  }, [])

  // Change target score
  const handleSetTargetScore = useCallback((newTarget) => {
    setTargetScore(newTarget)
  }, [])

  return {
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
    resetMatch: restartMatch,
    setDifficulty: handleSetDifficulty,
    setTargetScore: handleSetTargetScore,
  }
}
