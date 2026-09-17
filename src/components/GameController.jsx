import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import {
  BALL_BOUNDS,
  BALL_BOUNCE_RESTITUTION,
  BALL_INITIAL_POS,
  BALL_RADIUS,
  FLOOR_Y,
  GRAVITY,
  HIT_IMPULSE_Y,
  HIT_IMPULSE_Z,
  HIT_LATERAL_FACTOR,
  HIT_RADIUS,
  NET_HALF_THICKNESS,
  NET_TOP_Y,
  OPPONENT_BOUNDS,
  OPPONENT_INITIAL_POS,
  PLAYER_BOUNDS,
  PLAYER_INITIAL_POS,
  PLAYER_JUMP_IMPULSE,
  PLAYER_SPEED,
  predictLandingPoint,
} from '../game/constants'
import { useKeyboardControls } from '../game/useKeyboardControls'
import { NET_WIDTH } from '../constants/court'
import { getScaledAIDifficulty } from '../game/difficulty'

/**
 * GameController Component
 * Handles the complete arcade loop inside useFrame:
 * 1. Player controls (A/D, W/S, Arrows, Space to jump / hit)
 * 2. Opponent AI (proportional tracking, progressive difficulty, jump & hit impulse)
 * 3. Modak Ball arcade physics (gravity, ground bounce, net reflection, out-of-bounds limits)
 * 4. Real-time landing reticle trajectory projection
 * 5. Out-of-bounds & in-bounds ground hit detection with last-hitter attribution
 * 6. Pause / Resume state management
 */
export default function GameController({
  playerRef,
  opponentRef,
  ballRef,
  reticleRef,
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
  const keysRef = useKeyboardControls()

  // Player state
  const playerPosRef = useRef(new Vector3(...PLAYER_INITIAL_POS))
  const playerVelYRef = useRef(0)
  const isGroundedRef = useRef(true)

  // Opponent AI state
  const opponentPosRef = useRef(new Vector3(...OPPONENT_INITIAL_POS))
  const opponentVelYRef = useRef(0)
  const opponentIsGroundedRef = useRef(true)

  // Modak Ball state
  const ballPosRef = useRef(new Vector3(...BALL_INITIAL_POS))
  const ballVelRef = useRef(new Vector3(0, 0, 0))

  // Track who last touched the Modak ('player' | 'opponent' | null)
  const lastHitterRef = useRef(null)

  // Handle round resets (serves & new match)
  const lastRoundIdRef = useRef(roundId)

  useEffect(() => {
    if (roundId !== lastRoundIdRef.current) {
      lastRoundIdRef.current = roundId
      lastHitterRef.current = null

      // Reset Player and Opponent coordinates
      playerPosRef.current.set(...PLAYER_INITIAL_POS)
      playerVelYRef.current = 0
      isGroundedRef.current = true

      opponentPosRef.current.set(...OPPONENT_INITIAL_POS)
      opponentVelYRef.current = 0
      opponentIsGroundedRef.current = true

      // Serve drop Modak toward the side that conceded the point
      const serveZ = concedingSide === 'player' ? 2.8 : -2.8
      ballPosRef.current.set(0, 3.2, serveZ)
      ballVelRef.current.set(0, 0, 0)

      if (playerRef?.current) {
        playerRef.current.position.copy(playerPosRef.current)
        playerRef.current.rotation.set(0, Math.PI, 0)
      }
      if (opponentRef?.current) {
        opponentRef.current.position.copy(opponentPosRef.current)
        opponentRef.current.rotation.set(0, 0, 0)
      }
      if (ballRef?.current) {
        ballRef.current.position.copy(ballPosRef.current)
        ballRef.current.rotation.set(0, 0, 0)
      }
    }
  }, [roundId, concedingSide, playerRef, opponentRef, ballRef])

  useFrame((state, rawDelta) => {
    const keys = keysRef.current

    // Check pause key trigger (P / Esc)
    if (keys.pauseTriggered) {
      keys.pauseTriggered = false
      onTogglePause?.()
      return
    }

    // Freeze all physics and character updates when paused or game over
    if (isPaused || matchState === 'gameOver' || matchState === 'scored') {
      return
    }

    // Clamp delta to prevent physics tunneling
    const delta = Math.min(rawDelta, 0.045)

    const playerPos = playerPosRef.current
    const opponentPos = opponentPosRef.current
    const ballPos = ballPosRef.current
    const ballVel = ballVelRef.current

    // ==========================================
    // 1. MANUAL RESET TRIGGER (Press 'R')
    // ==========================================
    if (keys.resetTriggered) {
      keys.resetTriggered = false
      lastHitterRef.current = null
      if (onResetMatch) {
        onResetMatch()
      } else {
        playerPos.set(...PLAYER_INITIAL_POS)
        playerVelYRef.current = 0
        isGroundedRef.current = true

        opponentPos.set(...OPPONENT_INITIAL_POS)
        opponentVelYRef.current = 0
        opponentIsGroundedRef.current = true

        ballPos.set(...BALL_INITIAL_POS)
        ballVel.set(0, 0, 0)
      }
      return
    }

    // ==========================================
    // 2. PLAYER SPACEBAR ACTION (Hit vs Jump)
    // ==========================================
    if (keys.spaceTriggered) {
      keys.spaceTriggered = false

      const dx = ballPos.x - playerPos.x
      const dy = ballPos.y - (playerPos.y + 0.55)
      const dz = ballPos.z - playerPos.z
      const distToBall = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distToBall <= HIT_RADIUS) {
        // Mark player as last hitter
        lastHitterRef.current = 'player'

        // Hit Modak upward and forward toward opponent court (Z < 0)
        ballVel.y = HIT_IMPULSE_Y
        ballVel.z = HIT_IMPULSE_Z

        let lateralMove = 0
        if (keys.moveRight) lateralMove += 1
        if (keys.moveLeft) lateralMove -= 1
        ballVel.x = dx * HIT_LATERAL_FACTOR + lateralMove * 1.8

        // Visual smash leap
        playerVelYRef.current = 3.6
        isGroundedRef.current = false
      } else {
        // Regular jump with double-jump prevention
        if (isGroundedRef.current) {
          playerVelYRef.current = PLAYER_JUMP_IMPULSE
          isGroundedRef.current = false
        }
      }
    }

    // ==========================================
    // 3. PLAYER MOVEMENT & BOUNDARIES
    // ==========================================
    let moveX = 0
    let moveZ = 0
    if (keys.moveRight) moveX += 1
    if (keys.moveLeft) moveX -= 1
    if (keys.moveBackward) moveZ += 1
    if (keys.moveForward) moveZ -= 1

    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.7071
      moveZ *= 0.7071
    }

    playerPos.x += moveX * PLAYER_SPEED * delta
    playerPos.z += moveZ * PLAYER_SPEED * delta

    // Strictly enforce court lines and net boundary (minZ: 0.68)
    playerPos.x = Math.max(PLAYER_BOUNDS.minX, Math.min(PLAYER_BOUNDS.maxX, playerPos.x))
    playerPos.z = Math.max(PLAYER_BOUNDS.minZ, Math.min(PLAYER_BOUNDS.maxZ, playerPos.z))

    // Vertical jump physics
    if (!isGroundedRef.current || playerPos.y > FLOOR_Y) {
      playerVelYRef.current += GRAVITY * delta
      playerPos.y += playerVelYRef.current * delta

      if (playerPos.y <= FLOOR_Y) {
        playerPos.y = FLOOR_Y
        playerVelYRef.current = 0
        isGroundedRef.current = true
      }
    }

    if (playerRef?.current) {
      playerRef.current.position.set(playerPos.x, playerPos.y, playerPos.z)
      playerRef.current.rotation.z = -moveX * 0.08
    }

    // ==========================================
    // 4. OPPONENT COMPUTER AI
    // ==========================================
    const ai = getScaledAIDifficulty(difficulty, playerScore)

    // Check if ball is approaching or inside computer's half
    const ballHeadingToAI = ballPos.z < 0.6 || ballVel.z < -0.4

    if (ballHeadingToAI) {
      // Anticipate landing X with slight human-like error offset
      const trackingError = Math.sin(state.clock.elapsedTime * 3) * ai.errorMargin
      const targetX = ballPos.x + trackingError

      // Position AI slightly behind ball Z to smash back toward the net
      const targetZ = Math.max(
        OPPONENT_BOUNDS.minZ,
        Math.min(OPPONENT_BOUNDS.maxZ, ballPos.z - 0.7)
      )

      // Move toward target with scaled reaction speed
      const diffX = targetX - opponentPos.x
      const stepX = Math.sign(diffX) * Math.min(Math.abs(diffX), ai.speed * delta)
      opponentPos.x += stepX

      const diffZ = targetZ - opponentPos.z
      const stepZ = Math.sign(diffZ) * Math.min(Math.abs(diffZ), ai.speed * 0.75 * delta)
      opponentPos.z += stepZ
    } else {
      // Ball is safely on player's half -> smoothly drift back to home center position
      opponentPos.x += (0 - opponentPos.x) * Math.min(1, 3.2 * delta)
      opponentPos.z += (OPPONENT_INITIAL_POS[2] - opponentPos.z) * Math.min(1, 3.2 * delta)
    }

    // Keep AI strictly within its own boundary and behind the net (maxZ: -0.68)
    opponentPos.x = Math.max(OPPONENT_BOUNDS.minX, Math.min(OPPONENT_BOUNDS.maxX, opponentPos.x))
    opponentPos.z = Math.max(OPPONENT_BOUNDS.minZ, Math.min(OPPONENT_BOUNDS.maxZ, opponentPos.z))

    // AI Hit & Jump Detection
    const aiDx = ballPos.x - opponentPos.x
    const aiDy = ballPos.y - (opponentPos.y + 0.55)
    const aiDz = ballPos.z - opponentPos.z
    const aiDistToBall = Math.sqrt(aiDx * aiDx + aiDy * aiDy + aiDz * aiDz)

    // Trigger hit when ball is within strike radius and playable height
    if (aiDistToBall <= HIT_RADIUS && ballPos.y <= ai.jumpThresholdY && ballPos.z < 0.2) {
      // Mark opponent as last hitter
      lastHitterRef.current = 'opponent'

      // Hit Modak upward and forward toward player's court (Z > 0)
      ballVel.y = HIT_IMPULSE_Y
      ballVel.z = Math.abs(HIT_IMPULSE_Z) // Positive Z launch

      // Impart lateral aim toward player court with slight variance
      const aimOffset = (Math.random() - 0.5) * ai.aimVariance
      ballVel.x = aiDx * HIT_LATERAL_FACTOR + aimOffset

      // Visual AI smash leap
      opponentVelYRef.current = 3.6
      opponentIsGroundedRef.current = false
    }

    // Opponent vertical jump physics
    if (!opponentIsGroundedRef.current || opponentPos.y > FLOOR_Y) {
      opponentVelYRef.current += GRAVITY * delta
      opponentPos.y += opponentVelYRef.current * delta

      if (opponentPos.y <= FLOOR_Y) {
        opponentPos.y = FLOOR_Y
        opponentVelYRef.current = 0
        opponentIsGroundedRef.current = true
      }
    }

    if (opponentRef?.current) {
      opponentRef.current.position.set(opponentPos.x, opponentPos.y, opponentPos.z)
    }

    // ==========================================
    // 5. ARCADE BALL PHYSICS & POINT DETECTION
    // ==========================================
    ballVel.y += GRAVITY * delta

    ballPos.x += ballVel.x * delta
    ballPos.y += ballVel.y * delta
    ballPos.z += ballVel.z * delta

    // --- Ground Bounce & Point Scoring (In-Bounds vs Out-of-Bounds) ---
    const ballFloorLimit = FLOOR_Y + BALL_RADIUS
    if (ballPos.y <= ballFloorLimit) {
      ballPos.y = ballFloorLimit

      // If in active play, report ground contact coordinates & who last hit it
      if (matchState === 'playing' && onBallGrounded) {
        ballVel.set(0, 0, 0)
        onBallGrounded(ballPos.x, ballPos.z, lastHitterRef.current)
        return
      }

      if (ballVel.y < 0) {
        ballVel.y = -ballVel.y * BALL_BOUNCE_RESTITUTION
        ballVel.x *= 0.94
        ballVel.z *= 0.94
        if (Math.abs(ballVel.y) < 0.65) {
          ballVel.y = 0
        }
      }
    }

    // --- Net Collision ---
    const netReachX = NET_WIDTH / 2
    const netContactDist = BALL_RADIUS + NET_HALF_THICKNESS

    if (ballPos.y < NET_TOP_Y && Math.abs(ballPos.x) <= netReachX) {
      if (Math.abs(ballPos.z) < netContactDist) {
        if (ballPos.z >= 0) {
          ballPos.z = netContactDist
          ballVel.z = Math.abs(ballVel.z) * 0.72
        } else {
          ballPos.z = -netContactDist
          ballVel.z = -Math.abs(ballVel.z) * 0.72
        }
        ballVel.y *= 0.85
      }
    }

    // --- Outer Deck Walls (allows out-of-bounds ground landings) ---
    if (ballPos.x - BALL_RADIUS <= BALL_BOUNDS.minX) {
      ballPos.x = BALL_BOUNDS.minX + BALL_RADIUS
      ballVel.x = Math.abs(ballVel.x) * 0.78
    } else if (ballPos.x + BALL_RADIUS >= BALL_BOUNDS.maxX) {
      ballPos.x = BALL_BOUNDS.maxX - BALL_RADIUS
      ballVel.x = -Math.abs(ballVel.x) * 0.78
    }

    if (ballPos.z - BALL_RADIUS <= BALL_BOUNDS.minZ) {
      ballPos.z = BALL_BOUNDS.minZ + BALL_RADIUS
      ballVel.z = Math.abs(ballVel.z) * 0.78
    } else if (ballPos.z + BALL_RADIUS >= BALL_BOUNDS.maxZ) {
      ballPos.z = BALL_BOUNDS.maxZ - BALL_RADIUS
      ballVel.z = -Math.abs(ballVel.z) * 0.78
    }

    // --- Sync Ball mesh & rotation ---
    if (ballRef?.current) {
      ballRef.current.position.set(ballPos.x, ballPos.y, ballPos.z)
      ballRef.current.rotation.x += ballVel.z * 1.5 * delta
      ballRef.current.rotation.z -= ballVel.x * 1.5 * delta
    }

    // ==========================================
    // 6. REAL-TIME LANDING RETICLE PROJECTION
    // ==========================================
    if (reticleRef?.current) {
      const pred = predictLandingPoint(ballPos, ballVel, FLOOR_Y, GRAVITY)
      reticleRef.current.position.set(pred.x, FLOOR_Y + 0.015, pred.z)

      // Dynamic scale & opacity based on ball height
      const heightAboveFloor = Math.max(0, ballPos.y - ballFloorLimit)
      const scale = 0.85 + Math.min(0.55, heightAboveFloor * 0.16)
      reticleRef.current.scale.set(scale, scale, scale)

      // Fade reticle if ball is already rolling on the ground
      const targetOpacity = heightAboveFloor > 0.05
        ? Math.min(0.95, 0.45 + (1.0 / (heightAboveFloor + 0.5)) * 0.45)
        : 0.15

      reticleRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = targetOpacity
        }
      })
    }
  })

  return null
}
