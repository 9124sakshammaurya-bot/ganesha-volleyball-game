import { forwardRef } from 'react'
import { FLOOR_Y } from '../game/constants'

/**
 * LandingReticle Component
 * Visual landing indicator projected onto the court floor directly at the Modak's predicted impact coordinates.
 * Constructed with concentric glowing rings and a warm emissive disc.
 * Updates smoothly via ref in the useFrame loop without triggering React re-renders.
 */
const LandingReticle = forwardRef(function LandingReticle(
  {
    initialPosition = [0, FLOOR_Y + 0.015, 2.8],
    ...props
  },
  ref
) {
  return (
    <group ref={ref} position={initialPosition} {...props}>
      {/* Outer Glowing Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Inner Accent Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.22, 0.28, 24]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>

      {/* Soft Center Target Dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle Directional Chevron / Crosshairs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.54, 0.58, 4, 1, Math.PI / 4, Math.PI * 2]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

export default LandingReticle
