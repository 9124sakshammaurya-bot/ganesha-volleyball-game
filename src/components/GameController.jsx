import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import {
  BALL_BOUNDS,
  BALL_BOUNCE_RESTITUTION,
  BALL_RADIUS,
  FLOOR_Y,
  GRAVITY,
  HIT_RADIUS,
  INITIAL_SPEED_MULTIPLIER,
  MAX_CHARGE_TIME,
  MAX_HIT_POWER,
  MAX_SPEED_MULTIPLIER,
  MIN_HIT_POWER,
  NET_HALF_THICKNESS,
  NET_TOP_Y,
  OPPONENT_BOUNDS,
  OPPONENT_INITIAL_POS,
  PLAYER_BOUNDS,
  PLAYER_INITIAL_POS,
  PLAYER_JUMP_IMPULSE,
  PLAYER_SPEED,
  PLAYABLE_HIT_MAX_Y,
  PLAYABLE_HIT_MIN_Y,
  RETICLE_TRIGGER_RADIUS,
  SERVE_BALL_HEIGHT,
  SERVE_BALL_OFFSET_Z,
  SERVE_OPPONENT_POS,
  SERVE_PLAYER_POS,
  SPEED_RAMP_PER_5S,
  SPEED_RAMP_PER_HIT,
  calculateTrajectoryVelocity,
  predictLandingPoint,
} from '../game/constants'
import { useKeyboardControls } from '../game/useKeyboardControls'
import { NET_WIDTH } from '../constants/court'
import { getScaledAIDifficulty } from '../game/difficulty'

/**
 * GameController Component
 * Handles the complete arcade loop inside useFrame:
 * 1. Proximity-Based Auto-Hitting (No spacebar required during rallies)
 * 2. Progressive Ball Speed Ramping (Starts at 0.65x, ramps per hit / duration up to 1.5x, resets on point)
 * 3. Expanded Landing Reticle & Proximity Hit Zone (1.7x expanded collision tolerance)
 * 4. Back-of-the-court Serve System (Ready to Serve state with baseline placement)
 * 5. Opponent AI (Strategic power modulation & dynamic court tracking)
 * 6. Modak Ball arcade physics (gravity, ground bounce, net reflection, out-of-bounds limits)
 */
export default function GameController({
  playerRef,
  opponentRef,
  ballRef,
  reticleRef,
  impactPopRef,
  matchState = 'serving',
  isPaused = false,
  playerScore = 0,
  difficulty = 'medium',
  serverSide = 'player',
  roundId = 0,
  onBallGrounded,
  onServeTriggered,
  onChargeUpdate,
  onSpeedUpdate,
  onResetMatch,
  onTogglePause,
}) {
  const keysRef = useKeyboardControls()

  // Pop shockwave effect animation state
  const popEffectRef = useRef({ active: false, time: 0, x: 0, y: 0, z: 0 })

  // Player state
  const playerPosRef = useRef(new Vector3(...SERVE_PLAYER_POS))
  const playerVelYRef = useRef(0)
  const isGroundedRef = useRef(true)

  // Opponent AI state
  const opponentPosRef = useRef(new Vector3(...OPPONENT_INITIAL_POS))
  const opponentVelYRef = useRef(0)
  const opponentIsGroundedRef = useRef(true)

  // Modak Ball state
  const ballPosRef = useRef(
    new Vector3(0, FLOOR_Y + SERVE_BALL_HEIGHT, SERVE_PLAYER_POS[2] - SERVE_BALL_OFFSET_Z)
  )
  const ballVelRef = useRef(new Vector3(0, 0, 0))

  // Track who last touched the Modak ('player' | 'opponent' | null)
  const lastHitterRef = useRef(null)

  // Hit cooldown to debounce auto-hit and avoid double-contact
  const hitCooldownRef = useRef(0)

  // Progressive speed ramp tracking
  const speedMultiplierRef = useRef(INITIAL_SPEED_MULTIPLIER)
  const rallyHitsRef = useRef(0)
  const rallyTimeRef = useRef(0)

  // Serve charge state (for serve only)
  const chargeRef = useRef({
    isCharging: false,
    startTime: 0,
    power: MIN_HIT_POWER,
  })

  // AI serve timer
  const aiServeTimerRef = useRef(0)

  // Handle round resets (serves & new match)
  const lastRoundIdRef = useRef(null)

  useEffect(() => {
    if (roundId !== lastRoundIdRef.current) {
      lastRoundIdRef.current = roundId
      lastHitterRef.current = null
      aiServeTimerRef.current = 0
      hitCooldownRef.current = 0

      // Reset speed ramp
      speedMultiplierRef.current = INITIAL_SPEED_MULTIPLIER
      rallyHitsRef.current = 0
      rallyTimeRef.current = 0
      onSpeedUpdate?.({ speedMultiplier: INITIAL_SPEED_MULTIPLIER, rallyHits: 0 })

      // Reset serve charge
      chargeRef.current = {
        isCharging: false,
        startTime: 0,
        power: MIN_HIT_POWER,
      }
      onChargeUpdate?.({ isCharging: false, power: 0 })

      // Position characters and ball based on serving side
      if (serverSide === 'player') {
        playerPosRef.current.set(...SERVE_PLAYER_POS)
        playerVelYRef.current = 0
        isGroundedRef.current = true

        opponentPosRef.current.set(...OPPONENT_INITIAL_POS)
        opponentVelYRef.current = 0
        opponentIsGroundedRef.current = true

        // Spawn ball directly in front of Player at comfortable hit height
        ballPosRef.current.set(
          SERVE_PLAYER_POS[0],
          FLOOR_Y + SERVE_BALL_HEIGHT,
          SERVE_PLAYER_POS[2] - SERVE_BALL_OFFSET_Z
        )
        ballVelRef.current.set(0, 0, 0)
      } else {
        opponentPosRef.current.set(...SERVE_OPPONENT_POS)
        opponentVelYRef.current = 0
        opponentIsGroundedRef.current = true

        playerPosRef.current.set(...PLAYER_INITIAL_POS)
        playerVelYRef.current = 0
        isGroundedRef.current = true

        // Spawn ball directly in front of Opponent at comfortable hit height
        ballPosRef.current.set(
          SERVE_OPPONENT_POS[0],
          FLOOR_Y + SERVE_BALL_HEIGHT,
          SERVE_OPPONENT_POS[2] + SERVE_BALL_OFFSET_Z
        )
        ballVelRef.current.set(0, 0, 0)
      }

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
  }, [roundId, serverSide, playerRef, opponentRef, ballRef, onChargeUpdate, onSpeedUpdate])

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

    // Update auto-hit debounce cooldown
    if (hitCooldownRef.current > 0) {
      hitCooldownRef.current -= delta
    }

    // ==========================================
    // 1. MANUAL RESET TRIGGER (Press 'R')
    // ==========================================
    if (keys.resetTriggered) {
      keys.resetTriggered = false
      lastHitterRef.current = null
      hitCooldownRef.current = 0
      speedMultiplierRef.current = INITIAL_SPEED_MULTIPLIER
      rallyHitsRef.current = 0
      rallyTimeRef.current = 0
      onSpeedUpdate?.({ speedMultiplier: INITIAL_SPEED_MULTIPLIER, rallyHits: 0 })
      chargeRef.current = { isCharging: false, startTime: 0, power: MIN_HIT_POWER }
      onChargeUpdate?.({ isCharging: false, power: 0 })
      if (onResetMatch) {
        onResetMatch()
      }
      return
    }

    // ==========================================
    // 2. READY TO SERVE PHASE (Back-of-the-court setup)
    // ==========================================
    if (matchState === 'serving') {
      if (serverSide === 'player') {
        // Player moves along the baseline to adjust serve angle
        let moveX = 0
        if (keys.moveRight) moveX += 1
        if (keys.moveLeft) moveX -= 1

        playerPos.x += moveX * PLAYER_SPEED * delta
        playerPos.x = Math.max(PLAYER_BOUNDS.minX, Math.min(PLAYER_BOUNDS.maxX, playerPos.x))
        playerPos.z = SERVE_PLAYER_POS[2]
        playerPos.y = FLOOR_Y

        // Modak floats comfortably in front of player with subtle bobbing
        const hoverY = FLOOR_Y + SERVE_BALL_HEIGHT + Math.sin(state.clock.elapsedTime * 4.0) * 0.04
        ballPos.set(playerPos.x, hoverY, playerPos.z - SERVE_BALL_OFFSET_Z)
        ballVel.set(0, 0, 0)

        // Serve execution: player can press Space OR approach the ball
        if (keys.spacePressed) {
          keys.spacePressed = false
          chargeRef.current = {
            isCharging: true,
            startTime: state.clock.elapsedTime,
            power: MIN_HIT_POWER,
          }
          onChargeUpdate?.({ isCharging: true, power: 0 })
        }

        if (chargeRef.current.isCharging) {
          const elapsed = state.clock.elapsedTime - chargeRef.current.startTime
          const chargeRatio = Math.min(1.0, elapsed / MAX_CHARGE_TIME)
          const currentPower = MIN_HIT_POWER + chargeRatio * (MAX_HIT_POWER - MIN_HIT_POWER)
          chargeRef.current.power = currentPower
          onChargeUpdate?.({ isCharging: true, power: chargeRatio })

          const shouldRelease = chargeRatio >= 1.0 || keys.spaceReleased
          if (shouldRelease) {
            keys.spaceReleased = false
            chargeRef.current.isCharging = false
            onChargeUpdate?.({ isCharging: false, power: 0 })

            // Execute serve hit
            lastHitterRef.current = 'player'
            hitCooldownRef.current = 0.4
            speedMultiplierRef.current = INITIAL_SPEED_MULTIPLIER
            rallyHitsRef.current = 1
            rallyTimeRef.current = 0
            onSpeedUpdate?.({ speedMultiplier: INITIAL_SPEED_MULTIPLIER, rallyHits: 1 })

            // Target depth: low power = front court (-2.5), high power = back court (-7.5)
            const targetZ = -2.2 - chargeRatio * 5.2
            const openX = opponentPos.x < 0 ? 1.8 : -1.8
            let aimBias = 0
            if (keys.moveRight) aimBias += 1.4
            if (keys.moveLeft) aimBias -= 1.4
            const targetX = Math.max(
              OPPONENT_BOUNDS.minX + 0.4,
              Math.min(OPPONENT_BOUNDS.maxX - 0.4, openX + aimBias)
            )

            const { vx, vy, vz } = calculateTrajectoryVelocity(
              ballPos,
              targetX,
              targetZ,
              currentPower
            )
            ballVel.set(vx, vy, vz)

            // High-power serve pop effect
            if (chargeRatio >= 0.65) {
              popEffectRef.current = {
                active: true,
                time: 0,
                x: ballPos.x,
                y: ballPos.y,
                z: ballPos.z,
              }
            }

            // Serve leap
            playerVelYRef.current = 3.6 + chargeRatio * 2.2
            isGroundedRef.current = false

            onServeTriggered?.()
          }
        }
      } else {
        // Opponent is serving: AI wind-up and serve execution
        opponentPos.z = SERVE_OPPONENT_POS[2]
        opponentPos.y = FLOOR_Y

        // Modak floats in front of Opponent
        const hoverY = FLOOR_Y + SERVE_BALL_HEIGHT + Math.sin(state.clock.elapsedTime * 4.0) * 0.04
        ballPos.set(opponentPos.x, hoverY, opponentPos.z + SERVE_BALL_OFFSET_Z)
        ballVel.set(0, 0, 0)

        aiServeTimerRef.current += delta

        if (aiServeTimerRef.current >= 1.35) {
          aiServeTimerRef.current = 0
          lastHitterRef.current = 'opponent'
          hitCooldownRef.current = 0.4
          speedMultiplierRef.current = INITIAL_SPEED_MULTIPLIER
          rallyHitsRef.current = 1
          rallyTimeRef.current = 0
          onSpeedUpdate?.({ speedMultiplier: INITIAL_SPEED_MULTIPLIER, rallyHits: 1 })

          // AI picks shot power based on difficulty and player position
          const ai = getScaledAIDifficulty(difficulty, playerScore)
          const servePower = playerPos.z > 5.5 ? 0.35 : 0.55 + Math.random() * 0.35
          const serveRatio = (servePower - MIN_HIT_POWER) / (MAX_HIT_POWER - MIN_HIT_POWER)

          const targetZ = 2.2 + serveRatio * 5.2
          const openX = playerPos.x < 0 ? 1.8 : -1.8
          const variance = (Math.random() - 0.5) * ai.aimVariance
          const targetX = Math.max(
            PLAYER_BOUNDS.minX + 0.4,
            Math.min(PLAYER_BOUNDS.maxX - 0.4, openX + variance)
          )

          const { vx, vy, vz } = calculateTrajectoryVelocity(
            ballPos,
            targetX,
            targetZ,
            servePower
          )
          ballVel.set(vx, vy, vz)

          opponentVelYRef.current = 3.6
          opponentIsGroundedRef.current = false

          onServeTriggered?.()
        }
      }

      // Sync meshes during serve setup
      if (playerRef?.current) {
        playerRef.current.position.set(playerPos.x, playerPos.y, playerPos.z)
      }
      if (opponentRef?.current) {
        opponentRef.current.position.set(opponentPos.x, opponentPos.y, opponentPos.z)
      }
      if (ballRef?.current) {
        ballRef.current.position.set(ballPos.x, ballPos.y, ballPos.z)
      }
      if (reticleRef?.current) {
        reticleRef.current.position.set(ballPos.x, FLOOR_Y + 0.015, ballPos.z)
      }

      return
    }

    // ==========================================
    // 3. PROGRESSIVE SPEED RAMPING (Active Rally)
    // ==========================================
    rallyTimeRef.current += delta
    if (rallyTimeRef.current >= 5.0) {
      rallyTimeRef.current -= 5.0
      if (speedMultiplierRef.current < MAX_SPEED_MULTIPLIER) {
        speedMultiplierRef.current = Math.min(
          MAX_SPEED_MULTIPLIER,
          Number((speedMultiplierRef.current + SPEED_RAMP_PER_5S).toFixed(3))
        )
        onSpeedUpdate?.({
          speedMultiplier: speedMultiplierRef.current,
          rallyHits: rallyHitsRef.current,
        })
      }
    }

    // ==========================================
    // 4. LANDING RETICLE PREDICTION & ACTIVE TRIGGER ZONE
    // ==========================================
    const pred = predictLandingPoint(ballPos, ballVel, FLOOR_Y, GRAVITY)
    const distToReticle = Math.hypot(playerPos.x - pred.x, playerPos.z - pred.z)

    const dx = ballPos.x - playerPos.x
    const dy = ballPos.y - (playerPos.y + 0.55)
    const dz = ballPos.z - playerPos.z
    const distToBall = Math.sqrt(dx * dx + dy * dy + dz * dz)

    const isBallPlayable = ballPos.y >= PLAYABLE_HIT_MIN_Y && ballPos.y <= PLAYABLE_HIT_MAX_Y
    const isBallHeadingToPlayer = ballPos.z > -0.25 || ballVel.z > -0.2
    const inHitZone =
      (distToReticle <= RETICLE_TRIGGER_RADIUS || distToBall <= HIT_RADIUS) &&
      isBallPlayable &&
      isBallHeadingToPlayer

    // Real-time landing reticle projection and active trigger illumination
    if (reticleRef?.current) {
      reticleRef.current.position.set(pred.x, FLOOR_Y + 0.015, pred.z)

      const heightAboveFloor = Math.max(0, ballPos.y - (FLOOR_Y + BALL_RADIUS))
      const scale = 1.05 + Math.min(0.65, heightAboveFloor * 0.16)
      reticleRef.current.scale.set(scale, scale, scale)

      const targetOpacity =
        heightAboveFloor > 0.05
          ? Math.min(0.95, 0.45 + (1.0 / (heightAboveFloor + 0.5)) * 0.45)
          : 0.15

      // Active proximity trigger visual highlight
      const triggerAura = reticleRef.current.getObjectByName('triggerAura')
      const outerRing = reticleRef.current.getObjectByName('outerRing')
      if (triggerAura) {
        triggerAura.visible = inHitZone
      }
      if (outerRing && outerRing.material) {
        outerRing.material.color.set(inHitZone ? '#22c55e' : '#f59e0b')
      }

      reticleRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.name !== 'triggerAura') {
          child.material.opacity = targetOpacity
        }
      })
    }

    // ==========================================
    // 5. PROXIMITY-BASED AUTO-HITTING (Player Mushak)
    // ==========================================
    const canAutoHit =
      inHitZone &&
      lastHitterRef.current !== 'player' &&
      hitCooldownRef.current <= 0 &&
      matchState === 'playing'

    if (canAutoHit) {
      lastHitterRef.current = 'player'
      hitCooldownRef.current = 0.38

      // Ramp speed multiplier on each hit
      rallyHitsRef.current += 1
      speedMultiplierRef.current = Math.min(
        MAX_SPEED_MULTIPLIER,
        Number((speedMultiplierRef.current + SPEED_RAMP_PER_HIT).toFixed(3))
      )
      onSpeedUpdate?.({
        speedMultiplier: speedMultiplierRef.current,
        rallyHits: rallyHitsRef.current,
      })

      // Calculate shot power based on intercept precision and forward momentum
      const closeness = Math.max(0, 1.0 - distToReticle / RETICLE_TRIGGER_RADIUS)
      const forwardBoost = keys.moveForward ? 0.15 : keys.moveBackward ? -0.1 : 0
      const autoPower = Math.min(
        MAX_HIT_POWER,
        Math.max(MIN_HIT_POWER, 0.58 + closeness * 0.28 + forwardBoost)
      )
      const powerRatio = (autoPower - MIN_HIT_POWER) / (MAX_HIT_POWER - MIN_HIT_POWER)

      // Aim deep when high power, shallow when soft
      const targetZ = -2.0 - powerRatio * 5.8

      // Horizontal aim steering based on directional keys
      const openX = opponentPos.x < 0 ? 2.2 : -2.2
      let aimBias = 0
      if (keys.moveRight) aimBias += 1.8
      if (keys.moveLeft) aimBias -= 1.8
      const targetX = Math.max(
        OPPONENT_BOUNDS.minX + 0.4,
        Math.min(OPPONENT_BOUNDS.maxX - 0.4, openX + aimBias)
      )

      const { vx, vy, vz } = calculateTrajectoryVelocity(
        ballPos,
        targetX,
        targetZ,
        autoPower
      )
      ballVel.set(vx, vy, vz)

      // Trigger crisp hit pop shockwave effect
      popEffectRef.current = {
        active: true,
        time: 0,
        x: ballPos.x,
        y: ballPos.y,
        z: ballPos.z,
      }

      // Smooth jump/hit leap impulse
      playerVelYRef.current = 3.8 + powerRatio * 2.2
      isGroundedRef.current = false
    }

    // Manual Jump trigger (spacebar is optional and only used for manual jumping now)
    if (keys.spacePressed) {
      keys.spacePressed = false
      if (isGroundedRef.current) {
        playerVelYRef.current = PLAYER_JUMP_IMPULSE
        isGroundedRef.current = false
      }
    }

    // ==========================================
    // 6. PLAYER MOVEMENT & BOUNDARIES
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
    // 7. OPPONENT COMPUTER AI (Power Modulation & Proportional Tracking)
    // ==========================================
    const ai = getScaledAIDifficulty(difficulty, playerScore)
    const ballHeadingToAI = ballPos.z < 0.6 || ballVel.z < -0.4

    if (ballHeadingToAI) {
      const trackingError = Math.sin(state.clock.elapsedTime * 3) * ai.errorMargin
      const targetX = ballPos.x + trackingError

      const targetZ = Math.max(
        OPPONENT_BOUNDS.minZ,
        Math.min(OPPONENT_BOUNDS.maxZ, ballPos.z - 0.7)
      )

      const diffX = targetX - opponentPos.x
      const stepX = Math.sign(diffX) * Math.min(Math.abs(diffX), ai.speed * delta)
      opponentPos.x += stepX

      const diffZ = targetZ - opponentPos.z
      const stepZ = Math.sign(diffZ) * Math.min(Math.abs(diffZ), ai.speed * 0.75 * delta)
      opponentPos.z += stepZ
    } else {
      opponentPos.x += (0 - opponentPos.x) * Math.min(1, 3.2 * delta)
      opponentPos.z += (OPPONENT_INITIAL_POS[2] - opponentPos.z) * Math.min(1, 3.2 * delta)
    }

    opponentPos.x = Math.max(OPPONENT_BOUNDS.minX, Math.min(OPPONENT_BOUNDS.maxX, opponentPos.x))
    opponentPos.z = Math.max(OPPONENT_BOUNDS.minZ, Math.min(OPPONENT_BOUNDS.maxZ, opponentPos.z))

    // AI Hit Detection & Tactical Power Selection
    const aiDx = ballPos.x - opponentPos.x
    const aiDy = ballPos.y - (opponentPos.y + 0.55)
    const aiDz = ballPos.z - opponentPos.z
    const aiDistToBall = Math.sqrt(aiDx * aiDx + aiDy * aiDy + aiDz * aiDz)

    if (
      aiDistToBall <= HIT_RADIUS &&
      ballPos.y <= ai.jumpThresholdY &&
      ballPos.z < 0.25 &&
      lastHitterRef.current !== 'opponent' &&
      hitCooldownRef.current <= 0
    ) {
      lastHitterRef.current = 'opponent'
      hitCooldownRef.current = 0.38

      // Ramp speed multiplier on AI hit
      rallyHitsRef.current += 1
      speedMultiplierRef.current = Math.min(
        MAX_SPEED_MULTIPLIER,
        Number((speedMultiplierRef.current + SPEED_RAMP_PER_HIT).toFixed(3))
      )
      onSpeedUpdate?.({
        speedMultiplier: speedMultiplierRef.current,
        rallyHits: rallyHitsRef.current,
      })

      // Tactical Shot Power Selection:
      // Drop shot if player is far back; smash if player is near net
      let aiPower
      if (playerPos.z > 5.8) {
        aiPower = 0.32 + Math.random() * 0.12 // Low power drop shot
      } else if (playerPos.z < 2.8) {
        aiPower = 0.8 + Math.random() * 0.2 // High power smash
      } else {
        if (difficulty === 'easy') aiPower = 0.4 + Math.random() * 0.2
        else if (difficulty === 'medium') aiPower = 0.55 + Math.random() * 0.25
        else aiPower = 0.72 + Math.random() * 0.26
      }

      const aiChargeRatio = (aiPower - MIN_HIT_POWER) / (MAX_HIT_POWER - MIN_HIT_POWER)
      const targetZ = 1.8 + aiChargeRatio * 5.8

      // Target open space away from player
      const openX = playerPos.x < 0 ? 2.0 : -2.0
      const variance = (Math.random() - 0.5) * ai.aimVariance
      const targetX = Math.max(
        PLAYER_BOUNDS.minX + 0.4,
        Math.min(PLAYER_BOUNDS.maxX - 0.4, openX + variance)
      )

      const { vx, vy, vz } = calculateTrajectoryVelocity(
        ballPos,
        targetX,
        targetZ,
        aiPower
      )
      ballVel.set(vx, vy, vz)

      // High-power AI hit pop effect
      if (aiChargeRatio >= 0.65) {
        popEffectRef.current = {
          active: true,
          time: 0,
          x: ballPos.x,
          y: ballPos.y,
          z: ballPos.z,
        }
      }

      opponentVelYRef.current = 3.4 + aiChargeRatio * 2.4
      opponentIsGroundedRef.current = false
    }

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
    // 8. ARCADE BALL PHYSICS & SPEED TIME-STEP
    // ==========================================
    // Ball physics scale with progressive speed multiplier
    const ballDelta = delta * speedMultiplierRef.current

    ballVel.y += GRAVITY * ballDelta
    ballPos.x += ballVel.x * ballDelta
    ballPos.y += ballVel.y * ballDelta
    ballPos.z += ballVel.z * ballDelta

    // --- Ground Bounce & Point Scoring ---
    const ballFloorLimit = FLOOR_Y + BALL_RADIUS
    if (ballPos.y <= ballFloorLimit) {
      ballPos.y = ballFloorLimit

      if (matchState === 'playing' && onBallGrounded) {
        ballVel.set(0, 0, 0)
        // Reset speed on ball grounding
        speedMultiplierRef.current = INITIAL_SPEED_MULTIPLIER
        rallyHitsRef.current = 0
        rallyTimeRef.current = 0
        onSpeedUpdate?.({ speedMultiplier: INITIAL_SPEED_MULTIPLIER, rallyHits: 0 })

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

    // --- Outer Deck Walls ---
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

    // --- Update Shockwave Pop Effect ---
    if (impactPopRef?.current) {
      if (popEffectRef.current.active) {
        popEffectRef.current.time += delta
        const progress = popEffectRef.current.time / 0.28
        if (progress >= 1.0) {
          popEffectRef.current.active = false
          impactPopRef.current.visible = false
        } else {
          impactPopRef.current.visible = true
          impactPopRef.current.position.set(
            popEffectRef.current.x,
            popEffectRef.current.y,
            popEffectRef.current.z
          )
          const popScale = 0.5 + progress * 2.8
          impactPopRef.current.scale.set(popScale, popScale, popScale)
          if (impactPopRef.current.material) {
            impactPopRef.current.material.opacity = Math.max(0, 0.95 * (1.0 - progress))
          }
        }
      } else {
        impactPopRef.current.visible = false
      }
    }

    // --- Sync Ball mesh & rotation & speed trail glow ---
    if (ballRef?.current) {
      ballRef.current.position.set(ballPos.x, ballPos.y, ballPos.z)
      ballRef.current.rotation.x += ballVel.z * 1.5 * ballDelta
      ballRef.current.rotation.z -= ballVel.x * 1.5 * ballDelta

      const speed = Math.hypot(ballVel.x, ballVel.y, ballVel.z)
      const smashGlow = ballRef.current.getObjectByName('smashGlow')
      if (smashGlow) {
        const isSpeeding = speed > 9.5 || speedMultiplierRef.current > 1.05
        smashGlow.visible = isSpeeding
        if (isSpeeding && smashGlow.material) {
          smashGlow.material.opacity = Math.min(
            0.7,
            0.25 + (speedMultiplierRef.current - 0.65) * 0.4
          )
        }
      }
    }
  })

  return null
}
