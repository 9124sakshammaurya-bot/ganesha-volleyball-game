import GameScene from './components/GameScene'
import Hud from './components/Hud'
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
    roundId,
    onBallGrounded,
    togglePause,
    resumeGame,
    restartMatch,
    setDifficulty,
    setTargetScore,
  } = useGameLoop()

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
        roundId={roundId}
        onBallGrounded={onBallGrounded}
        onResetMatch={restartMatch}
        onTogglePause={togglePause}
      />
    </div>
  )
}

export default App
