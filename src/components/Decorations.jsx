import { COURT_LENGTH, COURT_WIDTH } from '../constants/court'

function Lotus({ position, scale = 1 }) {
  const petals = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2
    return (
      <mesh
        key={angle}
        position={[Math.cos(angle) * 0.22, 0.08, Math.sin(angle) * 0.22]}
        rotation={[-0.7, angle, 0]}
        castShadow
      >
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#f3b6c8" roughness={0.45} />
      </mesh>
    )
  })

  return (
    <group position={position} scale={scale}>
      {petals}
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#f4d35e" roughness={0.35} />
      </mesh>
    </group>
  )
}

function Diya({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.1, 16]} />
        <meshStandardMaterial color="#b45a1a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial
          color="#ffd36a"
          emissive="#ff9a3c"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  )
}

function Pillar({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.24, 12]} />
        <meshStandardMaterial color="#e8c36a" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1.9, 12]} />
        <meshStandardMaterial color="#f3e1b8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.28, 0.28, 12]} />
        <meshStandardMaterial color="#d9a441" metalness={0.25} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.42, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial
          color="#ef6b4a"
          emissive="#c2410c"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  )
}

export default function Decorations() {
  const x = COURT_WIDTH / 2 + 1.55
  const z = COURT_LENGTH / 2 + 1.35

  return (
    <group>
      <Pillar position={[x, 0, z]} />
      <Pillar position={[-x, 0, z]} />
      <Pillar position={[x, 0, -z]} />
      <Pillar position={[-x, 0, -z]} />

      <Lotus position={[x - 0.7, 0.18, 0]} scale={1.05} />
      <Lotus position={[-x + 0.7, 0.18, 0]} scale={1.05} />
      <Lotus position={[0, 0.18, z - 0.35]} scale={0.9} />
      <Lotus position={[0, 0.18, -z + 0.35]} scale={0.9} />

      <Diya position={[x - 0.15, 0.18, 3.2]} />
      <Diya position={[x - 0.15, 0.18, -3.2]} />
      <Diya position={[-x + 0.15, 0.18, 3.2]} />
      <Diya position={[-x + 0.15, 0.18, -3.2]} />
    </group>
  )
}
