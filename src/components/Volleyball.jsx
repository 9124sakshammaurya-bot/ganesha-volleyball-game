import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { BALL_HEIGHT, BALL_RADIUS } from '../constants/court'

function createVolleyballTexture() {
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.5, '#f6f1e8')
  gradient.addColorStop(1, '#efe6d8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#8d6a4a'
  ctx.lineWidth = 16
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()

  for (let i = 0; i < 4; i += 1) {
    const x = (i / 4) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  ctx.lineWidth = 12
  ctx.strokeStyle = '#a07855'
  for (let i = 0; i < 4; i += 1) {
    const cx = (i + 0.5) * (width / 4)
    ctx.beginPath()
    ctx.ellipse(cx, height / 2, width / 10, height / 2.15, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.beginPath()
  ctx.ellipse(width * 0.32, height * 0.32, 90, 48, -0.4, 0, Math.PI * 2)
  ctx.fill()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export default function Volleyball() {
  const texture = useMemo(() => createVolleyballTexture(), [])

  return (
    <group position={[0, BALL_HEIGHT, 0]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[BALL_RADIUS, 48, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.36}
          metalness={0.06}
        />
      </mesh>
    </group>
  )
}
