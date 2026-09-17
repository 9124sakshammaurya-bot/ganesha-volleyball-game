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
  const [matchState, setMatchState] = useState('playing') // 'playing' | 'scored' | 'serving' | 'gameOver'
  const [isPaused, setIsPaused] = useState(false)
  const [roundMessage, setRoundMessage] = useState(null)
  const [winner, setWinner] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [concedingSide, setConcedingSide] = useState('player')
  const [roundId, setRoundId] = useState(0)

  // Ref to hold latest state for use inside callbacks without stale closures
  const stateRef = useRef({
    playerScore,
    opponentScore,
    targetScore,
    matchState,
    isPaused,
    difficulty,
  })

  useEffect(() => {
    stateRef.current = {
      playerScore,
      opponentScore,
      targetScore,
      matchState,
      isPaused,
      difficulty,
    }
  }, [playerScore, opponentScore, targetScore, matchState, isPaused, difficulty])

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

    let scoringSide = null
    let pointMessage = ''

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

      if (nextScore >= currentTarget) {
        setWinner('player')
        setMatchState('gameOver')
        setRoundMessage('VICTORY! YOU WIN!')
      } else {
        setMatchState('scored')
        setRoundMessage(pointMessage)

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('SERVE!')
          setRoundId((prev) => prev + 1)

          timerRef.current = setTimeout(() => {
            setMatchState('playing')
            setRoundMessage(null)
          }, 850)
        }, 1250)
      }
    } else {
      const nextScore = oScore + 1
      setOpponentScore(nextScore)

      if (nextScore >= currentTarget) {
        setWinner('opponent')
        setMatchState('gameOver')
        setRoundMessage('COMPUTER WINS!')
      } else {
        setMatchState('scored')
        setRoundMessage(pointMessage)

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('SERVE!')
          setRoundId((prev) => prev + 1)

          timerRef.current = setTimeout(() => {
            setMatchState('playing')
            setRoundMessage(null)
          }, 850)
        }, 1250)
      }
    }
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
    setConcedingSide('player')
    setMatchState('serving')
    setRoundMessage('READY... SERVE!')
    setRoundId((prev) => prev + 1)

    timerRef.current = setTimeout(() => {
      setMatchState('playing')
      setRoundMessage(null)
    }, 900)
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
    roundId,
    onBallGrounded,
    togglePause,
    resumeGame,
    restartMatch,
    resetMatch: restartMatch,
    setDifficulty: handleSetDifficulty,
    setTargetScore: handleSetTargetScore,
  }
}
