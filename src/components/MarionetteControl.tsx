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
}

export default function MarionetteControl({ 
  position = [0, 1.5, 0],
  onStringControlsChange,
  stringCount = 8
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

  // Handle pointer move for dragging
  const handlePointerMove = (e: any) => {
    if (!isDragging || !controlRef.current) return
    
    // Raycast to find intersection with drag plane
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      ),
      camera
    )
    
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)
    
    const delta = new THREE.Vector3().subVectors(intersection, previousPointRef.current)
    
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
    
    previousPointRef.current.copy(intersection)
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
  useFrame(() => {
    if (controlRef.current) {
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
      {/* Main horizontal crossbar */}
      <mesh 
        castShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <cylinderGeometry args={[0.01, 0.01, 0.36, 8]} />
        <meshStandardMaterial 
          color={isDragging ? "#a0522d" : "#8b4513"}
          emissive={isDragging ? "#8b4513" : "#000000"}
          emissiveIntensity={isDragging ? 0.2 : 0}
        />
      </mesh>

      {/* Vertical stem/grip */}
      <mesh 
        position={[0, 0, -0.20]} 
        castShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
        <meshStandardMaterial 
          color={isDragging ? "#654321" : "#654321"}
          emissive={isDragging ? "#654321" : "#000000"}
          emissiveIntensity={isDragging ? 0.2 : 0}
        />
      </mesh>
      
      {/* Invisible larger hitbox for easier interaction */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        visible={false}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>

      {/* String attachment points (visual indicators) */}
      {/* Center (head/chest) - h_center */}
      <mesh position={[0, 0, -0.20]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Left (left hand) - h_left */}
      <mesh position={[-0.18, 0, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Right (right hand) - h_right */}
      <mesh position={[0.18, 0, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#45b7d1" emissive="#45b7d1" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Front (left shoulder, left foot) - h_front */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#96ceb4" emissive="#96ceb4" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Back (right shoulder, right foot) - h_back */}
      <mesh position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#a8d5ba" emissive="#a8d5ba" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
