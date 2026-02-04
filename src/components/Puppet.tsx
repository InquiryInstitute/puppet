import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import MarionetteStrings from './MarionetteStrings'

interface PuppetProps {
  stringControls?: {
    head?: number
    leftHand?: number
    rightHand?: number
    torso?: number
    leftFoot?: number
    rightFoot?: number
  }
  controlBarRef?: React.RefObject<THREE.Group>
}

export default function Puppet({ stringControls, controlBarRef }: PuppetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Group>(null)
  const leftUpperArmRef = useRef<THREE.Group>(null)
  const leftForearmRef = useRef<THREE.Group>(null)
  const rightUpperArmRef = useRef<THREE.Group>(null)
  const rightForearmRef = useRef<THREE.Group>(null)
  const leftThighRef = useRef<THREE.Group>(null)
  const leftShinRef = useRef<THREE.Group>(null)
  const rightThighRef = useRef<THREE.Group>(null)
  const rightShinRef = useRef<THREE.Group>(null)

  // Puppet parts are only controlled by strings, not directly animated
  // All movement comes from string tension controlled by the crossbar

  // Apply string controls to puppet parts (strings pull parts, creating movement)
  useFrame(() => {
    if (!stringControls) return

    // Head: pulled up by head string
    if (headRef.current && stringControls.head !== undefined) {
      const pull = stringControls.head
      headRef.current.position.y = 0.4 + pull * 0.1 // Lift head up
      headRef.current.rotation.x = -pull * 0.5 // Nod forward when pulled
    }

    // Torso: pulled up by chest string
    if (torsoRef.current && stringControls.torso !== undefined) {
      const pull = stringControls.torso
      torsoRef.current.position.y = 0 + pull * 0.05 // Lift torso slightly
      torsoRef.current.rotation.x = -pull * 0.3 // Lean back when pulled
    }

    // Left Arm: pulled up by left hand string
    if (leftUpperArmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftUpperArmRef.current.rotation.x = -pull * 1.2 // Raise upper arm
      leftUpperArmRef.current.rotation.z = pull * 0.5 // Rotate arm outward
    }
    // Left Elbow: bends when arm is raised
    if (leftForearmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftForearmRef.current.rotation.x = -pull * 0.8 // Bend elbow
    }

    // Right Arm: pulled up by right hand string
    if (rightUpperArmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightUpperArmRef.current.rotation.x = -pull * 1.2 // Raise upper arm
      rightUpperArmRef.current.rotation.z = -pull * 0.5 // Rotate arm outward
    }
    // Right Elbow: bends when arm is raised
    if (rightForearmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightForearmRef.current.rotation.x = -pull * 0.8 // Bend elbow
    }

    // Left Leg: pulled up by left foot string
    if (leftThighRef.current && stringControls.leftFoot !== undefined) {
      const pull = stringControls.leftFoot
      leftThighRef.current.rotation.x = pull * 0.8 // Lift thigh
      leftThighRef.current.rotation.z = pull * 0.2 // Rotate leg slightly
    }
    // Left Knee: bends when leg is lifted
    if (leftShinRef.current && stringControls.leftFoot !== undefined) {
      const pull = stringControls.leftFoot
      leftShinRef.current.rotation.x = pull * 0.6 // Bend knee
    }

    // Right Leg: pulled up by right foot string
    if (rightThighRef.current && stringControls.rightFoot !== undefined) {
      const pull = stringControls.rightFoot
      rightThighRef.current.rotation.x = pull * 0.8 // Lift thigh
      rightThighRef.current.rotation.z = -pull * 0.2 // Rotate leg slightly
    }
    // Right Knee: bends when leg is lifted
    if (rightShinRef.current && stringControls.rightFoot !== undefined) {
      const pull = stringControls.rightFoot
      rightShinRef.current.rotation.x = pull * 0.6 // Bend knee
    }
  })

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
      {/* Marionette strings */}
      <MarionetteStrings 
        puppetRef={groupRef} 
        controlBarRef={controlBarRef}
        stringControls={stringControls}
        puppetPosition={[0, 1, 0]}
      />

      {/* Torso (root of puppet hierarchy) */}
      <group ref={torsoRef} position={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>

        {/* Head (child of torso) */}
        <group ref={headRef} position={[0, 0.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </group>

        {/* Left Arm (child of torso) with elbow joint */}
        <group ref={leftUpperArmRef} position={[-0.25, 0.1, 0]}>
          {/* Upper arm */}
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Forearm (with elbow joint) */}
          <group ref={leftForearmRef} position={[0, -0.15, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.12, 0]} castShadow>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
          </group>
        </group>

        {/* Right Arm (child of torso) with elbow joint */}
        <group ref={rightUpperArmRef} position={[0.25, 0.1, 0]}>
          {/* Upper arm */}
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Forearm (with elbow joint) */}
          <group ref={rightForearmRef} position={[0, -0.15, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.12, 0]} castShadow>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
          </group>
        </group>

        {/* Left Leg (child of torso) with knee joint */}
        <group ref={leftThighRef} position={[-0.1, -0.3, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Shin (with knee joint) */}
          <group ref={leftShinRef} position={[0, -0.15, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.2, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.12, 0.05]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.15]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
          </group>
        </group>

        {/* Right Leg (child of torso) with knee joint */}
        <group ref={rightThighRef} position={[0.1, -0.3, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Shin (with knee joint) */}
          <group ref={rightShinRef} position={[0, -0.15, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.2, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.12, 0.05]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.15]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
