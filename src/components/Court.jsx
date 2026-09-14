import { RoundedBox } from '@react-three/drei'
import {
  ATTACK_LINE,
  COURT_LENGTH,
  COURT_THICKNESS,
  COURT_WIDTH,
} from '../constants/court'
import Decorations from './Decorations'

function CourtLine({ position, args }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color="#fff6e4"
        roughness={0.35}
        emissive="#ffe6b8"
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

export default function Court() {
  const halfLength = COURT_LENGTH / 2
  const lineY = COURT_THICKNESS / 2 + 0.02
  const lineH = 0.04
  const lineW = 0.1

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
        <circleGeometry args={[28, 64]} />
        <meshStandardMaterial color="#5b3a28" roughness={0.95} />
      </mesh>

      <RoundedBox
        args={[COURT_WIDTH + 4.4, 0.38, COURT_LENGTH + 4.4]}
        radius={0.18}
        smoothness={4}
        position={[0, -0.12, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="#c4843a" roughness={0.62} />
      </RoundedBox>

      <RoundedBox
        args={[COURT_WIDTH, COURT_THICKNESS, COURT_LENGTH / 2]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, halfLength / 2]}
        receiveShadow
      >
        <meshStandardMaterial color="#f2a23a" roughness={0.52} />
      </RoundedBox>

      <RoundedBox
        args={[COURT_WIDTH, COURT_THICKNESS, COURT_LENGTH / 2]}
        radius={0.05}
        smoothness={4}
        position={[0, 0, -halfLength / 2]}
        receiveShadow
      >
        <meshStandardMaterial color="#1fb7b0" roughness={0.52} />
      </RoundedBox>

      <CourtLine
        position={[0, lineY, 0]}
        args={[COURT_WIDTH, lineH, lineW]}
      />
      <CourtLine
        position={[0, lineY, ATTACK_LINE]}
        args={[COURT_WIDTH, lineH, lineW * 0.8]}
      />
      <CourtLine
        position={[0, lineY, -ATTACK_LINE]}
        args={[COURT_WIDTH, lineH, lineW * 0.8]}
      />
      <CourtLine
        position={[COURT_WIDTH / 2, lineY, 0]}
        args={[lineW, lineH, COURT_LENGTH]}
      />
      <CourtLine
        position={[-COURT_WIDTH / 2, lineY, 0]}
        args={[lineW, lineH, COURT_LENGTH]}
      />
      <CourtLine
        position={[0, lineY, halfLength]}
        args={[COURT_WIDTH, lineH, lineW]}
      />
      <CourtLine
        position={[0, lineY, -halfLength]}
        args={[COURT_WIDTH, lineH, lineW]}
      />

      <Decorations />
    </group>
  )
}
