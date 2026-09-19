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
      {/* Active Proximity Trigger Pulse Aura (illuminated when player is in zone) */}
      <mesh name="triggerAura" rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false} visible={false}>
        <ringGeometry args={[0.05, 1.45, 36]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Glowing Ring */}
      <mesh name="outerRing" rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.68, 0.82, 36]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.88}
          depthWrite={false}
        />
      </mesh>

      {/* Inner Accent Ring */}
      <mesh name="innerRing" rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.34, 0.44, 30]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>

      {/* Soft Center Target Dot */}
      <mesh name="centerDot" rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <circleGeometry args={[0.14, 20]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle Directional Chevron / Crosshairs */}
      <mesh name="crosshairs" rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <ringGeometry args={[0.85, 0.92, 4, 1, Math.PI / 4, Math.PI * 2]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

export default LandingReticle
