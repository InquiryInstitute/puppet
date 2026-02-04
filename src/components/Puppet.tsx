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

  // Gravity simulation
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0))
  const puppetBaseYRef = useRef(0.57) // Base Y position - feet should touch stage (stage at y=0, feet at -0.57 relative to torso)
  const GRAVITY = -9.81 * 0.1 // Scaled down for visual effect (m/s²)
  const DAMPING = 0.95 // Air resistance
  const STRING_LIFT_FORCE = 2.0 // How much strings can lift against gravity

  // Puppet parts are only controlled by strings, not directly animated
  // All movement comes from string tension controlled by the crossbar

  // Apply gravity and string controls to puppet parts
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Calculate total string pull (average of all active strings)
    const totalPull = stringControls ? (
      (stringControls.head || 0) +
      (stringControls.torso || 0) +
      (stringControls.leftHand || 0) +
      (stringControls.rightHand || 0) +
      (stringControls.leftFoot || 0) +
      (stringControls.rightFoot || 0)
    ) / 6 : 0

    // Apply gravity to puppet's base position
    // Strings counteract gravity - more pull = less gravity effect
    const gravityForce = GRAVITY * (1 - totalPull * 0.7) // Strings reduce gravity effect
    velocityRef.current.y += gravityForce * delta
    velocityRef.current.y *= DAMPING // Apply damping
    
    // Apply string lift force
    if (totalPull > 0) {
      velocityRef.current.y += totalPull * STRING_LIFT_FORCE * delta
    }

    // Update puppet base position
    puppetBaseYRef.current += velocityRef.current.y * delta
    
    // Floor collision - puppet can't fall below stage
    // Feet are at y = -0.57 relative to torso (torso at y=0, feet extend down 0.57)
    // Stage is at y=0, so puppet base (torso center) must be at least 0.57 above stage
    const floorY = 0.57 // Minimum height so feet touch stage
    if (puppetBaseYRef.current < floorY) {
      puppetBaseYRef.current = floorY
      velocityRef.current.y = 0
    }
    
    // Update puppet group position
    groupRef.current.position.y = puppetBaseYRef.current

    if (!stringControls) return

    // Head: pulled up by head string, or sagged by gravity
    if (headRef.current && stringControls.head !== undefined) {
      const pull = stringControls.head
      // When pulled: lift head, when relaxed: let gravity sag it forward
      headRef.current.position.y = 0.4 + pull * 0.1 // Lift head up
      headRef.current.rotation.x = -pull * 0.5 + (1 - pull) * 0.3 // Nod forward when pulled, sag forward when relaxed
    } else if (headRef.current) {
      // Gravity sag when no string control
      headRef.current.rotation.x = 0.3 // Head sags forward
    }

    // Torso: pulled up by chest string, or sagged by gravity
    if (torsoRef.current && stringControls.torso !== undefined) {
      const pull = stringControls.torso
      torsoRef.current.position.y = 0 + pull * 0.05 // Lift torso slightly
      torsoRef.current.rotation.x = -pull * 0.3 + (1 - pull) * 0.2 // Lean back when pulled, sag forward when relaxed
    } else if (torsoRef.current) {
      // Gravity sag when no string control
      torsoRef.current.rotation.x = 0.2 // Torso sags forward
    }

    // Left Arm: pulled up by left hand string, or sagged by gravity
    if (leftUpperArmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      // When pulled: raise arm, when relaxed: let gravity pull it down
      leftUpperArmRef.current.rotation.x = -pull * 1.2 + (1 - pull) * 0.8 // Raise when pulled, sag when relaxed
      leftUpperArmRef.current.rotation.z = pull * 0.5 // Rotate arm outward when pulled
    } else if (leftUpperArmRef.current) {
      // Gravity sag when no string control
      leftUpperArmRef.current.rotation.x = 0.8 // Arm hangs down
      leftUpperArmRef.current.rotation.z = 0
    }
    // Left Elbow: bends when arm is raised, or straightens when relaxed
    if (leftForearmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftForearmRef.current.rotation.x = -pull * 0.8 + (1 - pull) * 0.3 // Bend when pulled, slight bend when relaxed
    } else if (leftForearmRef.current) {
      leftForearmRef.current.rotation.x = 0.3 // Slight natural bend
    }

    // Right Arm: pulled up by right hand string, or sagged by gravity
    if (rightUpperArmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightUpperArmRef.current.rotation.x = -pull * 1.2 + (1 - pull) * 0.8 // Raise when pulled, sag when relaxed
      rightUpperArmRef.current.rotation.z = -pull * 0.5 // Rotate arm outward when pulled
    } else if (rightUpperArmRef.current) {
      // Gravity sag when no string control
      rightUpperArmRef.current.rotation.x = 0.8 // Arm hangs down
      rightUpperArmRef.current.rotation.z = 0
    }
    // Right Elbow: bends when arm is raised, or straightens when relaxed
    if (rightForearmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightForearmRef.current.rotation.x = -pull * 0.8 + (1 - pull) * 0.3 // Bend when pulled, slight bend when relaxed
    } else if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = 0.3 // Slight natural bend
    }

    // Left Leg: pulled up by left foot string, or hangs down by gravity
    if (leftThighRef.current && stringControls.leftFoot !== undefined) {
      const pull = stringControls.leftFoot
      leftThighRef.current.rotation.x = pull * 0.8 - (1 - pull) * 0.1 // Lift when pulled, slight forward when relaxed
      leftThighRef.current.rotation.z = pull * 0.2 // Rotate leg slightly when pulled
    } else if (leftThighRef.current) {
      // Gravity: leg hangs straight down
      leftThighRef.current.rotation.x = -0.1 // Slight forward lean
      leftThighRef.current.rotation.z = 0
    }
    // Left Knee: bends when leg is lifted, or straightens when relaxed
    if (leftShinRef.current && stringControls.leftFoot !== undefined) {
      const pull = stringControls.leftFoot
      leftShinRef.current.rotation.x = pull * 0.6 - (1 - pull) * 0.1 // Bend when pulled, slight bend when relaxed
    } else if (leftShinRef.current) {
      leftShinRef.current.rotation.x = -0.1 // Slight natural bend
    }

    // Right Leg: pulled up by right foot string, or hangs down by gravity
    if (rightThighRef.current && stringControls.rightFoot !== undefined) {
      const pull = stringControls.rightFoot
      rightThighRef.current.rotation.x = pull * 0.8 - (1 - pull) * 0.1 // Lift when pulled, slight forward when relaxed
      rightThighRef.current.rotation.z = -pull * 0.2 // Rotate leg slightly when pulled
    } else if (rightThighRef.current) {
      // Gravity: leg hangs straight down
      rightThighRef.current.rotation.x = -0.1 // Slight forward lean
      rightThighRef.current.rotation.z = 0
    }
    // Right Knee: bends when leg is lifted, or straightens when relaxed
    if (rightShinRef.current && stringControls.rightFoot !== undefined) {
      const pull = stringControls.rightFoot
      rightShinRef.current.rotation.x = pull * 0.6 - (1 - pull) * 0.1 // Bend when pulled, slight bend when relaxed
    } else if (rightShinRef.current) {
      rightShinRef.current.rotation.x = -0.1 // Slight natural bend
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.57, 0]}>
      {/* Marionette strings */}
      <MarionetteStrings 
        puppetRef={groupRef} 
        controlBarRef={controlBarRef}
        stringControls={stringControls}
        puppetPosition={[0, 0.57, 0]}
      />

      {/* Torso (root of puppet hierarchy) */}
      <group ref={torsoRef} position={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>

        {/* Head (child of torso) */}
        <group ref={headRef} position={[0, 0.4, 0]}>
          {/* Neck connector */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </group>

        {/* Left Arm (child of torso) with elbow joint */}
        <group ref={leftUpperArmRef} position={[-0.15, 0.1, 0]}>
          {/* Shoulder connector */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Upper arm */}
          <mesh position={[-0.09, 0, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Forearm (with elbow joint) */}
          <group ref={leftForearmRef} position={[-0.18, 0, 0]}>
            {/* Elbow connector */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            <mesh position={[-0.09, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            {/* Hand */}
            <mesh position={[-0.18, 0, 0]} castShadow>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
          </group>
        </group>

        {/* Right Arm (child of torso) with elbow joint */}
        <group ref={rightUpperArmRef} position={[0.15, 0.1, 0]}>
          {/* Shoulder connector */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Upper arm */}
          <mesh position={[0.09, 0, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Forearm (with elbow joint) */}
          <group ref={rightForearmRef} position={[0.18, 0, 0]}>
            {/* Elbow connector */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            <mesh position={[0.09, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
            {/* Hand */}
            <mesh position={[0.18, 0, 0]} castShadow>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fdbcb4" />
            </mesh>
          </group>
        </group>

        {/* Left Leg (child of torso) with knee joint */}
        <group ref={leftThighRef} position={[-0.1, -0.2, 0]}>
          {/* Hip connector */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Shin (with knee joint) */}
          <group ref={leftShinRef} position={[0, -0.2, 0]}>
            {/* Knee connector */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.2, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.2, 0.05]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.15]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
          </group>
        </group>

        {/* Right Leg (child of torso) with knee joint */}
        <group ref={rightThighRef} position={[0.1, -0.2, 0]}>
          {/* Hip connector */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Shin (with knee joint) */}
          <group ref={rightShinRef} position={[0, -0.2, 0]}>
            {/* Knee connector */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.2, 8]} />
              <meshStandardMaterial color="#2d3748" />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.2, 0.05]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.15]} />
              <meshStandardMaterial color="#1a202c" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
