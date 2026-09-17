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


// Hitting Mechanics
export const HIT_RADIUS = 1.85
export const HIT_IMPULSE_Y = 9.2
export const HIT_IMPULSE_Z = -11.6 // Upward and forward towards opponent court
export const HIT_LATERAL_FACTOR = 2.8 // Directs the ball left/right based on hit offset

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

export const BALL_BOUNDS = {
  minX: -COURT_WIDTH / 2 + 0.2, // -4.3
  maxX: COURT_WIDTH / 2 - 0.2,  //  4.3
  minZ: -COURT_LENGTH / 2 + 0.2,// -8.8
  maxZ: COURT_LENGTH / 2 - 0.2, //  8.8
}
