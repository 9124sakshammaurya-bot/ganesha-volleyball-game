import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import Court from './Court'
import Net from './Net'
import ModakBall from '../ModakBall'
import Mushak from '../Mushak'
import LandingReticle from './LandingReticle'
import GameController from './GameController'
import { BALL_INITIAL_POS, PLAYER_INITIAL_POS } from '../game/constants'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} color="#ffe8c8" />
      <hemisphereLight args={['#ffd9a0', '#3a5c6e', 0.55]} />
      <directionalLight
        position={[9, 16, 10]}
        intensity={1.55}
        color="#fff3d6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#7ad4ff" />
    </>
  )
}

export default function GameScene({
  matchState = 'playing',
  isPaused = false,
  playerScore = 0,
  difficulty = 'medium',
  concedingSide = 'player',
  roundId = 0,
  onBallGrounded,
  onResetMatch,
  onTogglePause,
}) {
  const playerRef = useRef()
  const opponentRef = useRef()
  const ballRef = useRef()
  const reticleRef = useRef()

  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[1, 2]}
      camera={{ position: [5.5, 8.4, 15.8], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#231433']} />
      <fog attach="fog" args={['#2b1840', 26, 62]} />
      <Lights />
      <Environment preset="sunset" environmentIntensity={0.18} />
      <Court />
      <Net />

      {/* Real-time Trajectory Landing Indicator on Court Floor */}
      <LandingReticle ref={reticleRef} />

      {/* Physics, AI, Reticle Projection, and Gameplay Loop Controller */}
      <GameController
        playerRef={playerRef}
        opponentRef={opponentRef}
        ballRef={ballRef}
        reticleRef={reticleRef}
        matchState={matchState}
        isPaused={isPaused}
        playerScore={playerScore}
        difficulty={difficulty}
        concedingSide={concedingSide}
        roundId={roundId}
        onBallGrounded={onBallGrounded}
        onResetMatch={onResetMatch}
        onTogglePause={onTogglePause}
      />


      {/* Modak Ball (Dynamic arcade physics) */}
      <ModakBall ref={ballRef} position={BALL_INITIAL_POS} />

      {/* Player Mushak (controlled via A/D, W/S, Arrows & Space) */}
      <Mushak
        ref={playerRef}
        variant="player"
        position={PLAYER_INITIAL_POS}
        rotation={[0, Math.PI, 0]}
      />

      {/* Opponent Mushak (guided by Computer AI) */}
      <Mushak
        ref={opponentRef}
        variant="opponent"
        position={[0, 0.08, -4.2]}
        rotation={[0, 0, 0]}
      />

      <ContactShadows
        position={[0, -0.18, 0]}
        opacity={0.38}
        scale={28}
        blur={2.4}
        far={12}
      />
      <OrbitControls
        enablePan={false}
        enableDamping
        minDistance={12}
        maxDistance={28}
        minPolarAngle={0.55}
        maxPolarAngle={1.2}
        target={[0, 0.7, 0]}
      />
    </Canvas>
  )
}


