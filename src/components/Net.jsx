import { useMemo } from 'react'
import { RepeatWrapping, CanvasTexture, SRGBColorSpace, DoubleSide } from 'three'
import {
  COURT_WIDTH,
  NET_HEIGHT,
  NET_WIDTH,
} from '../constants/court'

function createNetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 256, 128)
  ctx.strokeStyle = 'rgba(255, 252, 245, 0.9)'
  ctx.lineWidth = 4
  for (let x = 0; x <= 256; x += 16) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 128)
    ctx.stroke()
  }
  for (let y = 0; y <= 128; y += 16) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(10, 4)
  return texture
}

function Post({ x }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, NET_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, NET_HEIGHT, 12]} />
        <meshStandardMaterial color="#d9a441" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, NET_HEIGHT + 0.08, 0]} castShadow>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color="#f3d27a" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  )
}

export default function Net() {
  const netTexture = useMemo(() => createNetTexture(), [])
  const postX = NET_WIDTH / 2

  return (
    <group>
      <Post x={postX} />
      <Post x={-postX} />

      <mesh position={[0, NET_HEIGHT - 0.55, 0]}>
        <planeGeometry args={[NET_WIDTH - 0.18, 1.15]} />
        <meshStandardMaterial
          map={netTexture}
          transparent
          opacity={0.78}
          roughness={0.7}
          side={DoubleSide}
        />
      </mesh>

      <mesh position={[0, NET_HEIGHT - 0.02, 0]} castShadow>
        <boxGeometry args={[NET_WIDTH - 0.1, 0.08, 0.08]} />
        <meshStandardMaterial color="#fff8ea" roughness={0.4} />
      </mesh>

      <mesh position={[COURT_WIDTH / 2 + 0.04, NET_HEIGHT / 2 + 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, NET_HEIGHT - 0.2, 8]} />
        <meshStandardMaterial color="#ef6b4a" roughness={0.4} />
      </mesh>
      <mesh position={[-COURT_WIDTH / 2 - 0.04, NET_HEIGHT / 2 + 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, NET_HEIGHT - 0.2, 8]} />
        <meshStandardMaterial color="#ef6b4a" roughness={0.4} />
      </mesh>
    </group>
  )
}
