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
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

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
    if (leftArmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftArmRef.current.rotation.x = -pull * 1.2 // Raise arm
      leftArmRef.current.rotation.z = pull * 0.5 // Rotate arm outward
    }

    // Right Arm: pulled up by right hand string
    if (rightArmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightArmRef.current.rotation.x = -pull * 1.2 // Raise arm
      rightArmRef.current.rotation.z = -pull * 0.5 // Rotate arm outward
    }

    // Left Leg: pulled up by left foot string
    if (leftLegRef.current && stringControls.leftFoot !== undefined) {
      const pull = stringControls.leftFoot
      leftLegRef.current.rotation.x = pull * 0.8 // Lift leg
      leftLegRef.current.rotation.z = pull * 0.2 // Rotate leg slightly
    }

    // Right Leg: pulled up by right foot string
    if (rightLegRef.current && stringControls.rightFoot !== undefined) {
      const pull = stringControls.rightFoot
      rightLegRef.current.rotation.x = pull * 0.8 // Lift leg
      rightLegRef.current.rotation.z = -pull * 0.2 // Rotate leg slightly
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

        {/* Left Arm (child of torso) */}
        <group ref={leftArmRef} position={[-0.25, 0.1, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </group>

        {/* Right Arm (child of torso) */}
        <group ref={rightArmRef} position={[0.25, 0.1, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
        </group>

        {/* Left Leg (child of torso) */}
        <group ref={leftLegRef} position={[-0.1, -0.3, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.2, 0.05]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.15]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
        </group>

        {/* Right Leg (child of torso) */}
        <group ref={rightLegRef} position={[0.1, -0.3, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
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
  )
}
