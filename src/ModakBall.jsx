import { forwardRef, useMemo } from 'react'
import { CatmullRomCurve3, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { BALL_HEIGHT, BALL_RADIUS } from './constants/court'

/**
 * Procedural Modak Ball
 * Stylized traditional Indian modak shape with rounded base tapering to a pointed pleated tip.
 * Uses Three.js LatheGeometry for the organic core dumpling body and curved radial rib meshes for pleats.
 */
const ModakBall = forwardRef(function ModakBall(
  {
    position = [0, BALL_HEIGHT, 0],
    rotation = [0, 0, 0],
    scale = 1,
    ...props
  },
  ref
) {
  // 1. Procedural lathe profile for traditional modak dumpling body
  const { bodyGeometry, pleatGeometries } = useMemo(() => {
    const points = [
      new Vector2(0.001, -0.38),
      new Vector2(0.18, -0.36),
      new Vector2(0.33, -0.26),
      new Vector2(BALL_RADIUS * 0.98, -0.08), // Wide rounded base (~0.41)
      new Vector2(0.38, 0.10),
      new Vector2(0.28, 0.24),
      new Vector2(0.16, 0.36),
      new Vector2(0.05, 0.45),
      new Vector2(0.001, 0.50), // Pointed top tip
    ]
    const body = new LatheGeometry(points, 36)

    // 2. 10 radial pleat ridges along the perimeter (kavali)
    const pleats = []
    const pleatCount = 10
    const profilePoints = [
      [-0.34, 0.22],
      [-0.20, 0.36],
      [-0.06, 0.42],
      [0.10, 0.37],
      [0.24, 0.27],
      [0.36, 0.15],
      [0.45, 0.05],
    ]

    for (let i = 0; i < pleatCount; i += 1) {
      const angle = (i / pleatCount) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const curvePoints = profilePoints.map(([y, r]) => {
        // Slight radial bulge (+0.015) so the pleat stands out from the lathe body
        const pleatR = r + 0.014
        return new Vector3(cos * pleatR, y, sin * pleatR)
      })

      const curve = new CatmullRomCurve3(curvePoints)
      const tube = new TubeGeometry(curve, 18, 0.024, 8, false)
      pleats.push(tube)
    }

    return { bodyGeometry: body, pleatGeometries: pleats }
  }, [])

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale} {...props}>
      {/* Central Dumpling Core */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#fbe39d"
          roughness={0.35}
          metalness={0.06}
          emissive="#f5c768"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Visible Vertical Pleats / Ridges around perimeter */}
      {pleatGeometries.map((pleatGeo, idx) => (
        <mesh key={idx} geometry={pleatGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#f7dc92"
            roughness={0.32}
            metalness={0.08}
            emissive="#eaaf41"
            emissiveIntensity={0.06}
          />
        </mesh>
      ))}

      {/* Traditional Pinched Tip / Swirl Crown */}
      <mesh position={[0, 0.48, 0]} rotation={[0.08, 0.2, 0.05]} castShadow>
        <coneGeometry args={[0.048, 0.13, 16]} />
        <meshStandardMaterial
          color="#f6d37a"
          roughness={0.3}
          metalness={0.08}
          emissive="#d97706"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Saffron Tip Accent / Bindu */}
      <mesh position={[0.006, 0.54, 0.004]}>
        <sphereGeometry args={[0.018, 12, 10]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#ea580c"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
})

export default ModakBall
