import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MarionetteControlProps {
  position?: [number, number, number]
  onStringControlsChange?: (controls: {
    head: number
    leftHand: number
    rightHand: number
    torso?: number
    leftFoot?: number
    rightFoot?: number
  }) => void
  onPositionRotationChange?: (position: { x: number; y: number; z: number }, rotation: { roll: number; pitch: number; yaw: number }) => void
  stringCount?: number
  controlSequence?: {
    steps: Array<{
      startTime: number
      duration: number
      position?: [number, number, number]
      rotation?: [number, number, number]
    }>
    totalDuration: number
  }
  sequenceStartTime?: number | null
  controlBarRef?: React.RefObject<THREE.Group>
}

export default function MarionetteControl({ 
  position = [0, 1.5, 0],
  onStringControlsChange,
  onPositionRotationChange,
  stringCount = 8,
  controlSequence,
  sequenceStartTime,
  controlBarRef: externalControlBarRef
}: MarionetteControlProps) {
  const controlRef = useRef<THREE.Group>(null)
  
  // Sync internal ref to external ref if provided (so strings can track it)
  useEffect(() => {
    if (externalControlBarRef && controlRef.current) {
      // Update external ref to point to our internal ref's current value
      (externalControlBarRef as React.MutableRefObject<THREE.Group | null>).current = controlRef.current
    }
  }, [externalControlBarRef])
  
  // Also sync in useFrame to handle updates (runs every frame)
  useFrame(() => {
    if (externalControlBarRef && controlRef.current) {
      // Always keep the external ref in sync
      (externalControlBarRef as React.MutableRefObject<THREE.Group | null>).current = controlRef.current
    }
  })
  const [controlPosition, setControlPosition] = useState(() => new THREE.Vector3(...position))
  const [controlRotation, setControlRotation] = useState(() => new THREE.Euler(0, 0, 0))
  const pressedKeysRef = useRef(new Set<string>())
  
  // Keyboard controls for control bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }
      pressedKeysRef.current.add(e.key)
      // Also track modifier keys
      if (e.altKey) pressedKeysRef.current.add('Alt')
      if (e.shiftKey) pressedKeysRef.current.add('Shift')
      if (e.metaKey) pressedKeysRef.current.add('Meta')
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key)
      // Also track modifier keys
      if (!e.altKey) pressedKeysRef.current.delete('Alt')
      if (!e.shiftKey) pressedKeysRef.current.delete('Shift')
      if (!e.metaKey) pressedKeysRef.current.delete('Meta')
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Update control bar position/rotation based on pressed keys (in useFrame)
  useFrame((_, delta) => {
    const MOVE_SPEED = 2.0 // Units per second
    const ROTATE_SPEED = 1.0 // Radians per second
    const pressedKeys = pressedKeysRef.current
    
    setControlPosition(prev => {
      const newPos = prev.clone()
      
      // Arrow keys: translate Left/Right/Up/Down (only when Option is not pressed)
      if (!pressedKeys.has('Alt')) {
        if (pressedKeys.has('ArrowLeft')) {
          newPos.x -= MOVE_SPEED * delta
        }
        if (pressedKeys.has('ArrowRight')) {
          newPos.x += MOVE_SPEED * delta
        }
        if (pressedKeys.has('ArrowUp')) {
          newPos.y += MOVE_SPEED * delta
        }
        if (pressedKeys.has('ArrowDown')) {
          newPos.y -= MOVE_SPEED * delta
        }
      }
      
      // Option + Up/Down: move in Z (forward/back)
      if (pressedKeys.has('Alt') && !pressedKeys.has('Shift')) {
        if (pressedKeys.has('ArrowUp')) {
          newPos.z += MOVE_SPEED * delta
        }
        if (pressedKeys.has('ArrowDown')) {
          newPos.z -= MOVE_SPEED * delta
        }
      }
      
      return newPos
    })
    
    setControlRotation(prev => {
      const newRot = prev.clone()
      
      // Option + arrows: rotate control bar (tilt and pitch)
      if (pressedKeys.has('Alt') && !pressedKeys.has('Shift')) {
        // Option + Left/Right: rotate around Y axis (yaw/tilt)
        if (pressedKeys.has('ArrowLeft')) {
          newRot.y += ROTATE_SPEED * delta
        }
        if (pressedKeys.has('ArrowRight')) {
          newRot.y -= ROTATE_SPEED * delta
        }
        // Option + Up/Down: rotate around X axis (pitch)
        if (pressedKeys.has('ArrowUp')) {
          newRot.x += ROTATE_SPEED * delta
        }
        if (pressedKeys.has('ArrowDown')) {
          newRot.x -= ROTATE_SPEED * delta
        }
      }
      
      // Shift + Option + Left/Right: rotate around Z axis (roll)
      if (pressedKeys.has('Alt') && pressedKeys.has('Shift')) {
        if (pressedKeys.has('ArrowLeft')) {
          newRot.z += ROTATE_SPEED * delta
        }
        if (pressedKeys.has('ArrowRight')) {
          newRot.z -= ROTATE_SPEED * delta
        }
      }
      
      // Don't clamp Y rotation (allow full 360° spin)
      // Clamp X and Z rotations to prevent extreme tilting
      newRot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newRot.x))
      newRot.z = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newRot.z))
      
      return newRot
    })
  })

  // Update control bar transform
  useFrame((state) => {
    if (controlRef.current) {
      // Apply control sequence if provided (from commands)
      if (controlSequence && sequenceStartTime !== null && sequenceStartTime !== undefined) {
        const elapsed = state.clock.elapsedTime - sequenceStartTime
        const step = controlSequence.steps.find(
          (s) => elapsed >= s.startTime && elapsed < s.startTime + s.duration
        )
        
        if (step) {
          // Interpolate position
          if (step.position) {
            const basePos = new THREE.Vector3(...position)
            const targetPos = new THREE.Vector3(...step.position)
            const progress = (elapsed - step.startTime) / step.duration
            setControlPosition(basePos.clone().lerp(targetPos, progress))
          }
          
          // Interpolate rotation
          if (step.rotation) {
            const targetRot = new THREE.Euler(...step.rotation)
            const progress = (elapsed - step.startTime) / step.duration
            setControlRotation(new THREE.Euler().setFromQuaternion(
              new THREE.Quaternion().setFromEuler(controlRotation)
                .slerp(new THREE.Quaternion().setFromEuler(targetRot), progress)
            ))
          }
        }
      }
      
      // Update the control ref position/rotation so strings can track it
      controlRef.current.position.copy(controlPosition)
      controlRef.current.rotation.copy(controlRotation)
      
      // Report position and rotation to parent
      if (onPositionRotationChange) {
        // Convert Euler angles to roll/pitch/yaw
        // In Three.js: Euler.x = pitch, Euler.y = yaw, Euler.z = roll
        onPositionRotationChange(
          { x: controlPosition.x, y: controlPosition.y, z: controlPosition.z },
          { roll: controlRotation.z, pitch: controlRotation.x, yaw: controlRotation.y }
        )
      }
    }
  })

  // Calculate string controls based on control bar position and rotation
  useFrame(() => {
    if (onStringControlsChange && controlRef.current) {
      const baseY = position[1]
      const baseX = position[0]
      const currentY = controlPosition.y
      const currentX = controlPosition.x
      
      // String controls based on vertical position (0-1, where 1 is fully pulled)
      // When control bar is higher, strings are more relaxed (lower value)
      // When control bar is lower, strings are more pulled (higher value)
      const verticalPull = Math.max(0, Math.min(1, (baseY - currentY) / 0.5))
      
      // Horizontal position affects which side's strings are pulled
      // When control bar moves left (negative X), left side strings are pulled more
      // When control bar moves right (positive X), right side strings are pulled more
      const horizontalOffset = (currentX - baseX) / 0.3 // Scale horizontal movement
      
      // Rotation affects which strings are pulled
      const rotX = controlRotation.x // Forward/backward tilt (pitch)
      const rotZ = controlRotation.z // Sideways tilt (roll)
      
      const controls: any = {
        head: Math.max(0, Math.min(1, verticalPull + rotX * 0.3)),
        // Fix: Swap the horizontal offset - when control bar moves left (negative X), left arm should be pulled more
        // When control bar moves right (positive X), right arm should be pulled more
        leftHand: Math.max(0, Math.min(1, verticalPull - rotZ * 0.3 - horizontalOffset * 0.5)),
        rightHand: Math.max(0, Math.min(1, verticalPull + rotZ * 0.3 + horizontalOffset * 0.5)),
      }

      if (stringCount >= 4) {
        controls.torso = Math.max(0, Math.min(1, verticalPull))
      }
      if (stringCount >= 5) {
        controls.leftFoot = Math.max(0, Math.min(1, verticalPull - rotX * 0.2 - horizontalOffset * 0.3))
      }
      if (stringCount >= 6) {
        controls.rightFoot = Math.max(0, Math.min(1, verticalPull - rotX * 0.2 + horizontalOffset * 0.3))
      }

      onStringControlsChange(controls)
    }
  })

  return (
    <group ref={controlRef}>
      {/* Crossbar (horizontal bar) - smaller */}
      <mesh
        position={[0, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.008, 0.008, 0.24, 8]} />
        <meshStandardMaterial 
          color="#8b7355" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Stem (vertical handle) - smaller to match crossbar */}
      <mesh
        position={[0, 0, -0.10]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.006, 0.006, 0.20, 8]} />
        <meshStandardMaterial 
          color="#6b5d4a" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* String attachment points (visible pegs) */}
      {/* Center (head and chest) */}
      <mesh position={[0, 0, -0.20]} castShadow>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#d4af37"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Left end (left hand) */}
      <mesh position={[-0.12, 0, 0]} castShadow>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#d4af37"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Right end (right hand) */}
      <mesh position={[0.12, 0, 0]} castShadow>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#d4af37"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Front (left shoulder and left foot) - along Z axis (forward) */}
      <mesh position={[0, 0, 0.06]} castShadow>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#d4af37"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Back (right shoulder and right foot) - along Z axis (backward) */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          emissive="#d4af37"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      
    </group>
  )
}
