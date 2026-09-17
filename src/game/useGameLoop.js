import { useState, useCallback, useRef, useEffect } from 'react'

export const WINNING_SCORE = 5

/**
 * Custom hook managing the arcade Volleyball match game loop:
 * - Scores, win detection (first to 5), and game over state
 * - Point detection & round transitions (pause on score, serve drops)
 * - Difficulty presets (Easy, Medium, Hard)
 */
export function useGameLoop() {
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [matchState, setMatchState] = useState('playing') // 'playing' | 'scored' | 'serving' | 'gameOver'
  const [roundMessage, setRoundMessage] = useState(null)
  const [winner, setWinner] = useState(null)
  const [difficulty, setDifficulty] = useState('medium')
  const [concedingSide, setConcedingSide] = useState('player')
  const [roundId, setRoundId] = useState(0)

  // Ref to hold latest state for use inside callbacks without stale closures
  const stateRef = useRef({
    playerScore,
    opponentScore,
    matchState,
    difficulty,
  })

  useEffect(() => {
    stateRef.current = { playerScore, opponentScore, matchState, difficulty }
  }, [playerScore, opponentScore, matchState, difficulty])

  const timerRef = useRef(null)

  const clearPendingTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Triggered when the Modak touches the floor on either court half
  const onBallGrounded = useCallback((ballZ) => {
    const { matchState: currentMatchState, playerScore: pScore, opponentScore: oScore } = stateRef.current
    if (currentMatchState !== 'playing') return

    clearPendingTimers()

    // Determine which court side the ball landed on:
    // Z > 0 is the Player half; Z < 0 is the Opponent half.
    if (ballZ > 0) {
      // Ball landed on Player's court -> Point for Computer
      const nextScore = oScore + 1
      setOpponentScore(nextScore)
      setConcedingSide('player')

      if (nextScore >= WINNING_SCORE) {
        setWinner('opponent')
        setMatchState('gameOver')
        setRoundMessage('COMPUTER WINS!')
      } else {
        setMatchState('scored')
        setRoundMessage('POINT COMPUTER!')

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('SERVE!')
          setRoundId((prev) => prev + 1)

          timerRef.current = setTimeout(() => {
            setMatchState('playing')
            setRoundMessage(null)
          }, 850)
        }, 1200)
      }
    } else {
      // Ball landed on Opponent's court -> Point for Player
      const nextScore = pScore + 1
      setPlayerScore(nextScore)
      setConcedingSide('opponent')

      if (nextScore >= WINNING_SCORE) {
        setWinner('player')
        setMatchState('gameOver')
        setRoundMessage('VICTORY! YOU WIN!')
      } else {
        setMatchState('scored')
        setRoundMessage('POINT PLAYER!')

        timerRef.current = setTimeout(() => {
          setMatchState('serving')
          setRoundMessage('SERVE!')
          setRoundId((prev) => prev + 1)

          timerRef.current = setTimeout(() => {
            setMatchState('playing')
            setRoundMessage(null)
          }, 850)
        }, 1200)
      }
    }
  }, [])

  // Start fresh match
  const resetMatch = useCallback(() => {
    clearPendingTimers()
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

  return {
    playerScore,
    opponentScore,
    matchState,
    roundMessage,
    winner,
    difficulty,
    concedingSide,
    roundId,
    onBallGrounded,
    resetMatch,
    setDifficulty: handleSetDifficulty,
  }
}
