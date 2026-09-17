import { useEffect, useRef } from 'react'

/**
 * Custom React Hook for responsive arcade keyboard controls.
 * Captures directional keys (WASD + Arrows) and single-press action triggers (Space & R).
 * Uses a ref to avoid triggering unnecessary React re-renders during the 60fps useFrame loop.
 */
export function useKeyboardControls() {
  const keysRef = useRef({
    moveLeft: false,
    moveRight: false,
    moveForward: false,
    moveBackward: false,
    spaceTriggered: false,
    resetTriggered: false,
    pauseTriggered: false,
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey) return

      const code = event.code
      const keys = keysRef.current

      if (code === 'KeyA' || code === 'ArrowLeft') {
        keys.moveLeft = true
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        keys.moveRight = true
      } else if (code === 'KeyW' || code === 'ArrowUp') {
        keys.moveForward = true
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        keys.moveBackward = true
      } else if (code === 'Space') {
        event.preventDefault()
        // Only trigger once per keydown until consumed
        keys.spaceTriggered = true
      } else if (code === 'KeyR') {
        keys.resetTriggered = true
      } else if (code === 'KeyP' || code === 'Escape') {
        event.preventDefault()
        keys.pauseTriggered = true
      }
    }


    const handleKeyUp = (event) => {
      const code = event.code
      const keys = keysRef.current

      if (code === 'KeyA' || code === 'ArrowLeft') {
        keys.moveLeft = false
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        keys.moveRight = false
      } else if (code === 'KeyW' || code === 'ArrowUp') {
        keys.moveForward = false
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        keys.moveBackward = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keysRef
}
