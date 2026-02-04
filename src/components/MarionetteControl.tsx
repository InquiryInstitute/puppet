import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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
}

export default function MarionetteControl({ 
  position = [0, 1.5, 0],
  onStringControlsChange,
  stringCount = 8,
  controlSequence,
  sequenceStartTime
}: MarionetteControlProps) {
  const controlRef = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [controlPosition, setControlPosition] = useState(() => new THREE.Vector3(...position))
  const [controlRotation, setControlRotation] = useState(() => new THREE.Euler(0, 0, 0))
  
  // Track previous pointer position for delta calculation
  const previousPointRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))

  // Handle pointer down to start dragging
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    setIsDragging(true)
    
    // Store initial intersection point
    previousPointRef.current.copy(e.point)
    
    // Create a plane perpendicular to camera for dragging
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
      cameraDirection,
      e.point
    )
    
    gl.domElement.style.cursor = 'grabbing'
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  // Handle pointer move for dragging (called on the mesh)
  const handlePointerMove = (e: any) => {
    if (!isDragging || !controlRef.current) return
    e.stopPropagation()
    
    // Use the intersection point from the event
    const delta = new THREE.Vector3().subVectors(e.point, previousPointRef.current)
    
    // Update position (left/right, up/down)
    if (!e.shiftKey) {
      setControlPosition(prev => {
        const newPos = prev.clone()
        newPos.add(delta)
        return newPos
      })
    } else {
      // Shift key: rotate instead of translate
      setControlRotation(prev => {
        const newRot = prev.clone()
        // Tilt forward/backward (rotate around X axis based on Y movement)
        newRot.x += delta.y * 2
        // Tilt sideways (rotate around Z axis based on X movement)
        newRot.z += delta.x * 2
        // Clamp rotations
        newRot.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newRot.x))
        newRot.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newRot.z))
        return newRot
      })
    }
    
    previousPointRef.current.copy(e.point)
  }

  // Handle pointer up to stop dragging
  const handlePointerUp = (e: any) => {
    setIsDragging(false)
    gl.domElement.style.cursor = 'grab'
    if (e.target) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }
  }

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
      
      controlRef.current.position.copy(controlPosition)
      controlRef.current.rotation.copy(controlRotation)
    }
  })

  // Calculate string controls based on control bar position and rotation
  useFrame(() => {
    if (onStringControlsChange && controlRef.current) {
      const baseY = position[1]
      const currentY = controlPosition.y
      
      // String controls based on vertical position (0-1, where 1 is fully pulled)
      // When control bar is higher, strings are more relaxed (lower value)
      // When control bar is lower, strings are more pulled (higher value)
      const verticalPull = Math.max(0, Math.min(1, (baseY - currentY) / 0.5))
      
      // Rotation affects which strings are pulled
      const rotX = controlRotation.x // Forward/backward tilt
      const rotZ = controlRotation.z // Sideways tilt
      
      const controls: any = {
        head: Math.max(0, Math.min(1, verticalPull + rotX * 0.3)),
        leftHand: Math.max(0, Math.min(1, verticalPull - rotZ * 0.3)),
        rightHand: Math.max(0, Math.min(1, verticalPull + rotZ * 0.3)),
      }

      if (stringCount >= 4) {
        controls.torso = Math.max(0, Math.min(1, verticalPull))
      }
      if (stringCount >= 5) {
        controls.leftFoot = Math.max(0, Math.min(1, verticalPull - rotX * 0.2))
      }
      if (stringCount >= 6) {
        controls.rightFoot = Math.max(0, Math.min(1, verticalPull - rotX * 0.2))
      }

      onStringControlsChange(controls)
    }
  })

  return (
    <group ref={controlRef}>
      {/* Invisible control bar - functionality only, no visual */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        visible={false}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>
    </group>
  )
}
