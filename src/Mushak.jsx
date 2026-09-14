import { forwardRef, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'

/**
 * Reusable Mushak Component
 * Procedural Three.js character representing Lord Ganesha's celestial mouse companion.
 * Constructed strictly with Three.js primitives (capsules, spheres, cylinders, cones).
 * Supports 'player' (saffron/red tilak & orange accents) and 'opponent' (teal accents) variants.
 */
const Mushak = forwardRef(function Mushak(
  {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    variant = 'player',
    ...props
  },
  ref
) {
  const isPlayer = variant === 'player'

  // Accent colors based on variant
  const accentColor = isPlayer ? '#ea580c' : '#0d9488'
  const accentEmissive = isPlayer ? '#c2410c' : '#0f766e'
  const foreheadMarkColor = isPlayer ? '#dc2626' : '#06b6d4'
  const furColor = '#94877e'
  const furRoughness = 0.65
  const bellyColor = '#f5ede4'
  const innerEarColor = '#f2aba2'
  const noseColor = '#241a18'
  const eyeColor = '#161313'

  // Procedural curved S-tail behind body
  const tailGeometry = useMemo(() => {
    const curvePoints = [
      new Vector3(0, 0.22, -0.28),
      new Vector3(-0.06, 0.20, -0.50),
      new Vector3(0.06, 0.38, -0.66),
      new Vector3(0.18, 0.58, -0.56),
      new Vector3(0.12, 0.72, -0.42),
    ]
    const curve = new CatmullRomCurve3(curvePoints)
    return new TubeGeometry(curve, 22, 0.026, 8, false)
  }, [])

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale} {...props}>
      {/* --- BODY --- */}
      {/* Plump rounded torso capsule */}
      <mesh position={[0, 0.52, 0]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.34, 0.44, 16, 24]} />
        <meshStandardMaterial color={furColor} roughness={furRoughness} />
      </mesh>

      {/* Cute creamy belly patch */}
      <mesh position={[0, 0.48, 0.20]} rotation={[-0.1, 0, 0]} receiveShadow>
        <sphereGeometry args={[0.26, 20, 16]} />
        <meshStandardMaterial color={bellyColor} roughness={0.7} />
      </mesh>

      {/* --- HEAD --- */}
      <group position={[0, 0.92, 0.12]}>
        {/* Rounded head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.31, 24, 20]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>

        {/* Chubby cheeks */}
        <mesh position={[-0.15, -0.08, 0.16]} castShadow receiveShadow>
          <sphereGeometry args={[0.13, 16, 14]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>
        <mesh position={[0.15, -0.08, 0.16]} castShadow receiveShadow>
          <sphereGeometry args={[0.13, 16, 14]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>

        {/* Tapered cute snout */}
        <mesh
          position={[0, -0.06, 0.26]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[0.13, 0.24, 16]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>

        {/* Glossy button nose */}
        <mesh position={[0, -0.06, 0.38]} castShadow>
          <sphereGeometry args={[0.044, 14, 12]} />
          <meshStandardMaterial color={noseColor} roughness={0.2} metalness={0.1} />
        </mesh>

        {/* --- EYES --- */}
        {/* Left eye bead */}
        <mesh position={[-0.135, 0.07, 0.24]} castShadow>
          <sphereGeometry args={[0.048, 16, 14]} />
          <meshStandardMaterial color={eyeColor} roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Left eye catchlight highlight */}
        <mesh position={[-0.15, 0.09, 0.28]}>
          <sphereGeometry args={[0.015, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>

        {/* Right eye bead */}
        <mesh position={[0.135, 0.07, 0.24]} castShadow>
          <sphereGeometry args={[0.048, 16, 14]} />
          <meshStandardMaterial color={eyeColor} roughness={0.15} metalness={0.1} />
        </mesh>
        {/* Right eye catchlight highlight */}
        <mesh position={[0.12, 0.09, 0.28]}>
          <sphereGeometry args={[0.015, 10, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>

        {/* --- EARS --- */}
        {/* Left ear outer */}
        <mesh
          position={[-0.28, 0.26, -0.04]}
          rotation={[0.18, -0.3, -0.35]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.22, 0.032, 24]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>
        {/* Left ear inner pink pad */}
        <mesh
          position={[-0.276, 0.264, -0.024]}
          rotation={[0.18, -0.3, -0.35]}
        >
          <cylinderGeometry args={[0.145, 0.145, 0.034, 20]} />
          <meshStandardMaterial color={innerEarColor} roughness={0.6} />
        </mesh>

        {/* Right ear outer */}
        <mesh
          position={[0.28, 0.26, -0.04]}
          rotation={[0.18, 0.3, 0.35]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.22, 0.032, 24]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>
        {/* Right ear inner pink pad */}
        <mesh
          position={[0.276, 0.264, -0.024]}
          rotation={[0.18, 0.3, 0.35]}
        >
          <cylinderGeometry args={[0.145, 0.145, 0.034, 20]} />
          <meshStandardMaterial color={innerEarColor} roughness={0.6} />
        </mesh>

        {/* --- FOREHEAD ACCENTS / TILAK --- */}
        {isPlayer ? (
          /* Sacred Red/Saffron Tilak on Forehead */
          <group position={[0, 0.14, 0.27]} rotation={[-0.28, 0, 0]}>
            {/* Vermilion vertical mark */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.034, 0.13, 0.016]} />
              <meshStandardMaterial
                color={foreheadMarkColor}
                roughness={0.4}
                emissive="#991b1b"
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Golden center bindu */}
            <mesh position={[0, -0.02, 0.01]}>
              <sphereGeometry args={[0.018, 12, 10]} />
              <meshStandardMaterial
                color="#fbbf24"
                roughness={0.3}
                emissive="#d97706"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ) : (
          /* Opponent Teal Forehead Gem/Mark */
          <group position={[0, 0.14, 0.27]} rotation={[-0.28, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.036, 16, 14]} />
              <meshStandardMaterial
                color={foreheadMarkColor}
                roughness={0.25}
                emissive="#0891b2"
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        )}

        {/* Ear accent rings / ribbons */}
        <mesh
          position={[-0.43, 0.16, -0.04]}
          rotation={[0, 0, 0.4]}
        >
          <torusGeometry args={[0.048, 0.015, 10, 16]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentEmissive}
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* --- LIMBS --- */}
      {/* Left arm in athletic volleyball ready posture */}
      <group position={[-0.28, 0.54, 0.18]} rotation={[0.65, -0.35, 0.3]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.075, 0.22, 10, 16]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>
        {/* Distinct wristband */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.05, 16]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentEmissive}
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>
        {/* Paw pad */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color={bellyColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Right arm in athletic volleyball ready posture */}
      <group position={[0.28, 0.54, 0.18]} rotation={[0.65, 0.35, -0.3]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.075, 0.22, 10, 16]} />
          <meshStandardMaterial color={furColor} roughness={furRoughness} />
        </mesh>
        {/* Distinct wristband */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.05, 16]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentEmissive}
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>
        {/* Paw pad */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color={bellyColor} roughness={0.6} />
        </mesh>
      </group>

      {/* --- FEET (Grounded at y = 0) --- */}
      {/* Left foot */}
      <mesh position={[-0.20, 0.06, 0.08]} rotation={[0, -0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.12, 0.26]} />
        <meshStandardMaterial color={furColor} roughness={furRoughness} />
      </mesh>
      <mesh position={[-0.20, 0.05, 0.17]} castShadow>
        <sphereGeometry args={[0.075, 14, 10]} />
        <meshStandardMaterial color={bellyColor} roughness={0.6} />
      </mesh>

      {/* Right foot */}
      <mesh position={[0.20, 0.06, 0.08]} rotation={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.12, 0.26]} />
        <meshStandardMaterial color={furColor} roughness={furRoughness} />
      </mesh>
      <mesh position={[0.20, 0.05, 0.17]} castShadow>
        <sphereGeometry args={[0.075, 14, 10]} />
        <meshStandardMaterial color={bellyColor} roughness={0.6} />
      </mesh>

      {/* --- TAIL --- */}
      <mesh geometry={tailGeometry} castShadow>
        <meshStandardMaterial color={furColor} roughness={furRoughness} />
      </mesh>
    </group>
  )
})

export default Mushak
