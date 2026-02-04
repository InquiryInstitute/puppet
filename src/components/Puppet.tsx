import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import MarionetteStrings from './MarionetteStrings'
import { MotionSequence } from '../llm/types'

interface PuppetProps {
  sequence?: MotionSequence
  sequenceStartTime?: number | null
}

export default function Puppet({ sequence, sequenceStartTime }: PuppetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

  // Apply motion sequence to puppet parts
  useFrame((state) => {
    if (!sequence || sequenceStartTime === null || sequenceStartTime === undefined) {
      return
    }

    const elapsed = state.clock.elapsedTime - sequenceStartTime
    
    // Find the current step in the sequence
    const step = sequence.steps.find(
      (s) => elapsed >= s.startTime && elapsed < s.startTime + s.duration
    )

    if (step && state.clock.elapsedTime % 1 < 0.1) {
      // Log every second for debugging
      console.log('[Puppet] Applying step:', step, 'elapsed:', elapsed.toFixed(2))
    }

    if (step) {
      // Apply rotations to body parts based on step
      if (headRef.current && step.rotations.head) {
        if (step.rotations.head.x !== undefined) headRef.current.rotation.x = step.rotations.head.x
        if (step.rotations.head.y !== undefined) headRef.current.rotation.y = step.rotations.head.y
        if (step.rotations.head.z !== undefined) headRef.current.rotation.z = step.rotations.head.z
      }

      if (torsoRef.current && step.rotations.torso) {
        if (step.rotations.torso.x !== undefined) torsoRef.current.rotation.x = step.rotations.torso.x
        if (step.rotations.torso.y !== undefined) torsoRef.current.rotation.y = step.rotations.torso.y
        if (step.rotations.torso.z !== undefined) torsoRef.current.rotation.z = step.rotations.torso.z
      }

      if (leftArmRef.current && step.rotations.leftArm) {
        if (step.rotations.leftArm.x !== undefined) leftArmRef.current.rotation.x = step.rotations.leftArm.x
        if (step.rotations.leftArm.y !== undefined) leftArmRef.current.rotation.y = step.rotations.leftArm.y
        if (step.rotations.leftArm.z !== undefined) leftArmRef.current.rotation.z = step.rotations.leftArm.z
      }

      if (rightArmRef.current && step.rotations.rightArm) {
        if (step.rotations.rightArm.x !== undefined) rightArmRef.current.rotation.x = step.rotations.rightArm.x
        if (step.rotations.rightArm.y !== undefined) rightArmRef.current.rotation.y = step.rotations.rightArm.y
        if (step.rotations.rightArm.z !== undefined) rightArmRef.current.rotation.z = step.rotations.rightArm.z
      }

      if (leftLegRef.current && step.rotations.leftLeg) {
        if (step.rotations.leftLeg.x !== undefined) leftLegRef.current.rotation.x = step.rotations.leftLeg.x
        if (step.rotations.leftLeg.y !== undefined) leftLegRef.current.rotation.y = step.rotations.leftLeg.y
        if (step.rotations.leftLeg.z !== undefined) leftLegRef.current.rotation.z = step.rotations.leftLeg.z
      }

      if (rightLegRef.current && step.rotations.rightLeg) {
        if (step.rotations.rightLeg.x !== undefined) rightLegRef.current.rotation.x = step.rotations.rightLeg.x
        if (step.rotations.rightLeg.y !== undefined) rightLegRef.current.rotation.y = step.rotations.rightLeg.y
        if (step.rotations.rightLeg.z !== undefined) rightLegRef.current.rotation.z = step.rotations.rightLeg.z
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
      {/* Marionette strings */}
      <MarionetteStrings puppetRef={groupRef} />

      {/* Head */}
      <group ref={headRef} position={[0, 0.4, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" />
        </mesh>
      </group>

      {/* Torso */}
      <group ref={torsoRef} position={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.4, 0.2]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      </group>

      {/* Left Arm */}
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

      {/* Right Arm */}
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

      {/* Left Leg */}
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

      {/* Right Leg */}
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
  )
}
