import GameScene from './components/GameScene'
import Hud from './components/Hud'
import { useGameLoop } from './game/useGameLoop'
import './App.css'

function App() {
  const {
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
    setDifficulty,
  } = useGameLoop()

  return (
    <div className="app">
      <Hud
        playerScore={playerScore}
        opponentScore={opponentScore}
        matchState={matchState}
        roundMessage={roundMessage}
        winner={winner}
        difficulty={difficulty}
        onSelectDifficulty={setDifficulty}
        onResetMatch={resetMatch}
      />
      <GameScene
        matchState={matchState}
        playerScore={playerScore}
        difficulty={difficulty}
        concedingSide={concedingSide}
        roundId={roundId}
        onBallGrounded={onBallGrounded}
        onResetMatch={resetMatch}
      />
    </div>
  )
}

export default App
