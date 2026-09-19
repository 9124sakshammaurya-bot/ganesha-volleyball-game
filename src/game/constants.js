import {
  BALL_HEIGHT,
  BALL_RADIUS,
  COURT_LENGTH,
  COURT_WIDTH,
  NET_HEIGHT,
} from '../constants/court'

/**
 * Arcade Game Physics & Court Constants
 *
 * Coordinates:
 * - X: Lateral court width (Left/Right, from -COURT_WIDTH/2 to +COURT_WIDTH/2)
 * - Y: Vertical height (0.08 is the top surface of the court floor)
 * - Z: Court length (Net is at Z = 0; Player court is Z > 0; Opponent court is Z < 0)
 */

export const FLOOR_Y = 0.08

// Net Divider
export const NET_POSITION_Z = 0
export const NET_POSITION_X = 0 // for 2D reference
export const NET_TOP_Y = NET_HEIGHT // 2.24
export const NET_HALF_THICKNESS = 0.15

// Ball Dimensions & Physics
export { BALL_HEIGHT, BALL_RADIUS }
export const BALL_INITIAL_POS = [0, 2.6, 2.8] // In front of player, ready to volley
export const GRAVITY = -16.0
export const BALL_BOUNCE_RESTITUTION = 0.76

// Player & Opponent Movement & Positions
export const PLAYER_INITIAL_POS = [0, 0.08, 4.2]
export const OPPONENT_INITIAL_POS = [0, 0.08, -4.2]
export const PLAYER_SPEED = 7.5
export const PLAYER_JUMP_IMPULSE = 7.8


// Serve Positions & Setup
export const SERVE_PLAYER_POS = [0, FLOOR_Y, 7.6]
export const SERVE_OPPONENT_POS = [0, FLOOR_Y, -7.6]
export const SERVE_BALL_OFFSET_Z = 1.15
export const SERVE_BALL_HEIGHT = 1.45

// Hitting Mechanics & Power Modulation (Expanded Collision Tolerances)
export const HIT_RADIUS = 3.2 // Expanded collision radius (~1.7x from 1.9)
export const HIT_IMPULSE_Y = 9.2
export const HIT_IMPULSE_Z = -11.6 // Upward and forward towards opponent court
export const HIT_LATERAL_FACTOR = 2.8 // Directs the ball left/right based on hit offset

// Progressive Ball Speed Ramping Constants
export const INITIAL_SPEED_MULTIPLIER = 0.65 // Reduced initial velocity scaling
export const MAX_SPEED_MULTIPLIER = 1.50     // Speed cap
export const SPEED_RAMP_PER_HIT = 0.04       // +4% acceleration per hit
export const SPEED_RAMP_PER_5S = 0.03        // +3% gradual acceleration per 5s rally

// Proximity-Based Auto-Aim & Landing Reticle
export const MAX_CHARGE_TIME = 0.65 // Maximum seconds to reach 100% serve power
export const MIN_HIT_POWER = 0.35   // Soft lob / drop shot
export const MAX_HIT_POWER = 1.0    // Full-power smash / spike
export const RETICLE_TRIGGER_RADIUS = 3.85 // Expanded landing radius (~1.7x from 2.25)
export const PLAYABLE_HIT_MIN_Y = 0.40
export const PLAYABLE_HIT_MAX_Y = 4.2

// Boundaries
export const PLAYER_BOUNDS = {
  minX: -COURT_WIDTH / 2 + 0.5, // -4.0
  maxX: COURT_WIDTH / 2 - 0.5,  //  4.0
  minZ: 0.68,                   // Cannot pass net towards opponent
  maxZ: COURT_LENGTH / 2 - 0.6, //  8.4 (court baseline)
}

export const OPPONENT_BOUNDS = {
  minX: -COURT_WIDTH / 2 + 0.5, // -4.0
  maxX: COURT_WIDTH / 2 - 0.5,  //  4.0
  minZ: -COURT_LENGTH / 2 + 0.6,// -8.4
  maxZ: -0.68,                  // Cannot pass net towards player
}

// Court Playable Boundaries
export const COURT_HALF_WIDTH = COURT_WIDTH / 2   // 4.5
export const COURT_HALF_LENGTH = COURT_LENGTH / 2 // 9.0

// Line contact tolerance (ball edge touching the boundary line is IN)
export const IN_BOUNDS_TOLERANCE_X = COURT_HALF_WIDTH + BALL_RADIUS * 0.45 // ~4.69
export const IN_BOUNDS_TOLERANCE_Z = COURT_HALF_LENGTH + BALL_RADIUS * 0.45 // ~9.19

// Outer court deck boundaries (allows out-of-bounds landing on the wooden apron)
export const BALL_BOUNDS = {
  minX: -6.6,
  maxX: 6.6,
  minZ: -11.0,
  maxZ: 11.0,
}

// Match Options
export const TARGET_SCORE_OPTIONS = [3, 5, 7, 11]
export const DEFAULT_TARGET_SCORE = 5

/**
 * Calculates predicted landing position (X, Z) and time-to-impact when the ball hits the floor.
 * Uses the ball's current position, velocity, and gravity equation: y(t) = y0 + vy*t + 0.5*g*t^2.
 * Also accounts for net reflection if ball crosses net plane below NET_TOP_Y.
 */
export function predictLandingPoint(ballPos, ballVel, floorY = FLOOR_Y, gravity = GRAVITY) {
  const targetY = floorY + BALL_RADIUS
  const deltaY = ballPos.y - targetY

  if (deltaY <= 0.01) {
    return { x: ballPos.x, z: ballPos.z, timeToLand: 0, height: 0 }
  }

  // Solve quadratic: 0.5 * gravity * t^2 + ballVel.y * t + deltaY = 0
  const disc = ballVel.y * ballVel.y - 2 * gravity * deltaY
  if (disc < 0) {
    return { x: ballPos.x, z: ballPos.z, timeToLand: 0, height: deltaY }
  }

  // Root for t > 0 with negative gravity
  const t = (-ballVel.y - Math.sqrt(disc)) / gravity
  const landX = ballPos.x + ballVel.x * t
  let landZ = ballPos.z + ballVel.z * t

  // Net reflection check along trajectory
  if (Math.abs(ballVel.z) > 0.05) {
    const tNet = -ballPos.z / ballVel.z
    if (tNet > 0 && tNet < t) {
      const yAtNet = ballPos.y + ballVel.y * tNet + 0.5 * gravity * tNet * tNet
      if (yAtNet < NET_TOP_Y) {
        // Will bounce off the net horizontally
        const remainingTime = t - tNet
        landZ = -ballVel.z * 0.72 * remainingTime
      }
    }
  }

  return {
    x: landX,
    z: landZ,
    timeToLand: t,
    height: deltaY,
  }
}

/**
 * Calculates optimal velocity (vx, vy, vz) to launch the ball from current position
 * to a target landing coordinate (targetX, targetZ) on the opponent court.
 * Mathematically guarantees net clearance (above NET_TOP_Y) without backward misfires.
 * Modulates flight speed and arc height according to shot power (MIN_HIT_POWER .. MAX_HIT_POWER).
 */
export function calculateTrajectoryVelocity(
  ballPos,
  targetX,
  targetZ,
  power = 0.5,
  gravity = GRAVITY,
  netTopY = NET_TOP_Y,
  floorY = FLOOR_Y
) {
  const targetY = floorY + BALL_RADIUS
  const y0 = Math.max(floorY + BALL_RADIUS, ballPos.y)
  const z0 = ballPos.z
  const x0 = ballPos.x

  // Ensure targetZ is strictly on the other side of the net
  const hittingTowardOpponent = z0 >= 0
  const validTargetZ = hittingTowardOpponent
    ? Math.min(-1.5, targetZ)
    : Math.max(1.5, targetZ)

  const distZ = validTargetZ - z0
  // Ratio along flight path where the ball crosses the net plane (z = 0)
  const rNet = -z0 / distZ

  // Net clearance requirement:
  // Lower power = slightly loftier arc over net (~0.6m)
  // Higher power = driving arc (~0.42m)
  const netClearance = 0.42 + (1.0 - Math.min(1.0, Math.max(0.1, power))) * 0.3
  const yReqNet = netTopY + netClearance

  let T = 0.85

  if (rNet > 0.05 && rNet < 0.95) {
    // Parabolic fit through (0, y0), (rNet * T, yReqNet), and (T, targetY)
    const num = (yReqNet - y0) - rNet * (targetY - y0)
    const denom = 0.5 * gravity * rNet * (rNet - 1.0)
    if (denom !== 0 && (num / denom) > 0) {
      const tBase = Math.sqrt(num / denom)
      // Speed factor based on power: high power accelerates flight, low power relaxes flight
      const speedFactor = 0.74 + (1.0 - power) * 0.42
      T = Math.max(0.48, Math.min(1.35, tBase * speedFactor))
    }
  }

  // Calculate base vy to reach targetY at time T
  let vy = (targetY - y0 - 0.5 * gravity * T * T) / T

  // Safeguard: explicitly ensure height at net crossing exceeds NET_TOP_Y + minimum clearance
  if (rNet > 0.05 && rNet < 0.95) {
    const tNet = rNet * T
    const minNetY = netTopY + 0.35
    const yAtNet = y0 + vy * tNet + 0.5 * gravity * tNet * tNet
    if (yAtNet < minNetY) {
      vy = (minNetY - y0 - 0.5 * gravity * tNet * tNet) / tNet
    }
  }

  const vz = distZ / T
  const vx = (targetX - x0) / T

  return {
    vx,
    vy,
    vz,
    flightTime: T,
  }
}

