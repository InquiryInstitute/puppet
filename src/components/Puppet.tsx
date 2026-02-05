import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import MarionetteStrings from './MarionetteStrings'
import { calculateAllStringPhysics } from '../physics/stringPhysics'
import { initializePuppetPhysics, createDefaultJointConfigs, applyStringForcesToJoints, applyGravity, stepPuppetPhysics, PuppetPhysicsState } from '../physics/puppetPhysics'

interface StringPosition {
  x: number
  y: number
  z: number
}

interface StringPositions {
  head?: StringPosition
  chest?: StringPosition
  leftHand?: StringPosition
  rightHand?: StringPosition
  leftShoulder?: StringPosition
  rightShoulder?: StringPosition
  leftFoot?: StringPosition
  rightFoot?: StringPosition
}

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
  controlBarPosition?: { x: number; y: number; z: number }
  controlBarRotation?: { roll: number; pitch: number; yaw: number }
  onStringPull?: (stringName: string, pullAmount: number) => void
  onPositionsChange?: (positions: {
    controller: StringPositions
    stringStart: StringPositions
    stringEnd: StringPositions
    puppet: StringPositions
  }) => void
  stringRestLengths?: Map<string, number> // Optional overrides for string rest lengths
}

export default function Puppet({ 
  stringControls, 
  controlBarRef, 
  controlBarPosition = { x: 0, y: 2.5, z: 0 },
  controlBarRotation = { roll: 0, pitch: 0, yaw: 0 },
  onStringPull, 
  onPositionsChange,
  stringRestLengths
}: PuppetProps) {
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

  // Force-based physics state (use ref for mutable state updated every frame)
  const physicsStateRef = useRef<PuppetPhysicsState>(initializePuppetPhysics())
  const physicsConfig = createDefaultJointConfigs()
  const useForceBasedPhysics = controlBarPosition && controlBarRotation // Enable force-based physics when control bar state is provided

  // Gravity simulation with mass
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0))
  // Feet are at y=-0.625 relative to torso center (hip at -0.2, thigh extends -0.1, shin extends -0.1, foot at -0.225)
  // Stage is at y=0, so puppet base (torso center) should be at y=0.625 for feet to touch stage
  const puppetBaseYRef = useRef(0.625)
  const puppetBaseXRef = useRef(0) // Horizontal position constraint
  const puppetBaseZRef = useRef(0) // Depth position constraint
  const kneeBendRef = useRef({ left: 0, right: 0 }) // Track knee bending from ground collision
  const MASS = 2.0 // Puppet mass (kg) - makes it heavier, harder to lift
  const GRAVITY = -9.81 * 0.15 // Gravity force (m/s²) - always constant
  const DAMPING = 0.92 // Air resistance (stronger damping = more mass effect)
  const MAX_STRING_LIFT = 1.5 // Maximum lift force from strings (can only partially counteract gravity)
  const MAX_HEIGHT = 2.0 // Maximum height puppet can reach (based on string length)
  const MAX_HORIZONTAL_DISTANCE = 1.0 // Maximum horizontal distance from center

  // Puppet parts are controlled by force-based physics from string tensions

  // Force-based physics: calculate string tensions and apply forces to joints
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Use force-based physics if control bar state is provided
    if (useForceBasedPhysics && controlBarPosition && controlBarRotation) {
      // Get puppet base position and rotation
      const group = groupRef.current
      if (!group) return
      
      const puppetBasePos = new THREE.Vector3(
        group.position.x,
        group.position.y,
        group.position.z
      )
      const puppetBaseRot = new THREE.Euler(0, 0, 0) // Puppet base doesn't rotate

      // Get puppet attachment points in world space
      const getWorldPositionFromRef = (ref: React.RefObject<THREE.Group> | undefined, offset: THREE.Vector3): THREE.Vector3 => {
        if (ref?.current) {
          const worldPos = new THREE.Vector3()
          ref.current.getWorldPosition(worldPos)
          const localOffset = offset.clone().applyQuaternion(ref.current.getWorldQuaternion(new THREE.Quaternion()))
          return worldPos.add(localOffset)
        }
        // Fallback: calculate from puppet group
        const puppetWorldQuat = new THREE.Quaternion()
        group.getWorldQuaternion(puppetWorldQuat)
        return offset.clone().applyQuaternion(puppetWorldQuat).add(puppetBasePos)
      }

      const puppetAttachmentPoints = {
        head: headRef.current 
          ? getWorldPositionFromRef(headRef, new THREE.Vector3(0, 0.15, 0))
          : new THREE.Vector3(0, 0.55, 0).add(puppetBasePos),
        chest: new THREE.Vector3(0, 0.2, 0).add(puppetBasePos),
        leftHand: leftForearmRef.current
          ? getWorldPositionFromRef(leftForearmRef, new THREE.Vector3(-0.18, 0, 0))
          : new THREE.Vector3(-0.51, 0.1, 0).add(puppetBasePos),
        rightHand: rightForearmRef.current
          ? getWorldPositionFromRef(rightForearmRef, new THREE.Vector3(0.18, 0, 0))
          : new THREE.Vector3(0.51, 0.1, 0).add(puppetBasePos),
        leftShoulder: new THREE.Vector3(-0.15, 0.1, 0).add(puppetBasePos),
        rightShoulder: new THREE.Vector3(0.15, 0.1, 0).add(puppetBasePos),
        leftFoot: leftShinRef.current
          ? getWorldPositionFromRef(leftShinRef, new THREE.Vector3(0, -0.2, 0.05))
          : new THREE.Vector3(-0.1, -0.8, 0.05).add(puppetBasePos),
        rightFoot: rightShinRef.current
          ? getWorldPositionFromRef(rightShinRef, new THREE.Vector3(0, -0.2, 0.05))
          : new THREE.Vector3(0.1, -0.8, 0.05).add(puppetBasePos),
      }

      // Convert control bar rotation from roll/pitch/yaw to Euler
      const controlBarEuler = new THREE.Euler(
        controlBarRotation.pitch,
        controlBarRotation.yaw,
        controlBarRotation.roll,
        'YXZ'
      )
      const controlBarPos = new THREE.Vector3(
        controlBarPosition.x,
        controlBarPosition.y,
        controlBarPosition.z
      )

      // Calculate string tensions
      const stringStates = calculateAllStringPhysics(
        controlBarPos,
        controlBarEuler,
        puppetAttachmentPoints,
        stringRestLengths
      )

      // Apply string forces to joints (forces propagate up hierarchy: head→torso, arms→shoulders→torso)
      applyStringForcesToJoints(
        stringStates,
        physicsStateRef.current,
        physicsConfig,
        puppetBasePos,
        puppetBaseRot
      )

      // Apply torso force to puppet base position
      // The torso is the root, so all forces that propagate to it move the whole puppet
      // Torso force accumulates forces from all child joints (head, arms, etc.)
      const torsoForce = physicsStateRef.current.torso.force.clone()
      
      // Apply force to base position (F = ma, so a = F/m)
      const baseMass = MASS
      const baseAcceleration = torsoForce.clone().divideScalar(baseMass)
      
      // Update base velocity from acceleration
      velocityRef.current.add(baseAcceleration.clone().multiplyScalar(delta))
      
      // Apply damping to base velocity
      velocityRef.current.multiplyScalar(DAMPING)
      
      // Update base position from velocity
      puppetBasePos.add(velocityRef.current.clone().multiplyScalar(delta))
      
      // Apply gravity to base
      const gravityForce = GRAVITY / baseMass
      velocityRef.current.y += gravityForce * delta
      
      // Floor collision
      const STAGE_Y = 0
      const FOOT_BOTTOM_OFFSET = -0.625
      if (puppetBasePos.y + FOOT_BOTTOM_OFFSET < STAGE_Y) {
        puppetBasePos.y = STAGE_Y - FOOT_BOTTOM_OFFSET
        if (velocityRef.current.y < 0) {
          velocityRef.current.y = 0
        }
      }
      
      // Update puppet group position from physics
      group.position.copy(puppetBasePos)

      // Apply gravity
      applyGravity(physicsStateRef.current)

      // Step physics simulation
      stepPuppetPhysics(physicsStateRef.current, physicsConfig, delta)

      // Apply physics joint rotations to the visible puppet so it bends instead of staying rigid
      const ps = physicsStateRef.current
      if (torsoRef.current) torsoRef.current.rotation.copy(ps.torso.rotation)
      if (headRef.current) headRef.current.rotation.copy(ps.head.rotation)
      if (leftUpperArmRef.current) leftUpperArmRef.current.rotation.copy(ps.leftShoulder.rotation)
      if (rightUpperArmRef.current) rightUpperArmRef.current.rotation.copy(ps.rightShoulder.rotation)
      if (leftForearmRef.current) leftForearmRef.current.rotation.copy(ps.leftElbow.rotation)
      if (rightForearmRef.current) rightForearmRef.current.rotation.copy(ps.rightElbow.rotation)
      if (leftThighRef.current) leftThighRef.current.rotation.copy(ps.leftHip.rotation)
      if (rightThighRef.current) rightThighRef.current.rotation.copy(ps.rightHip.rotation)
      if (leftShinRef.current) leftShinRef.current.rotation.copy(ps.leftKnee.rotation)
      if (rightShinRef.current) rightShinRef.current.rotation.copy(ps.rightKnee.rotation)
    } else {
      // Kinematic mode: compute base position from gravity and string lift

    // Calculate total string pull (average of all active strings)
    const totalPull = stringControls ? (
      (stringControls.head || 0) +
      (stringControls.torso || 0) +
      (stringControls.leftHand || 0) +
      (stringControls.rightHand || 0) +
      (stringControls.leftFoot || 0) +
      (stringControls.rightFoot || 0)
    ) / 6 : 0

    // Apply constant gravity (always pulling down, regardless of strings)
    const gravityForce = GRAVITY / MASS // Gravity scaled by mass (heavier = slower fall)
    velocityRef.current.y += gravityForce * delta
    
    // Apply string lift force (can only partially counteract gravity)
    // Strings can lift, but gravity always wins if strings are relaxed
    const stringLiftForce = (totalPull * MAX_STRING_LIFT) / MASS
    velocityRef.current.y += stringLiftForce * delta
    
    // Apply damping (simulates air resistance and mass inertia)
    velocityRef.current.y *= DAMPING
    velocityRef.current.x *= DAMPING
    velocityRef.current.z *= DAMPING

    // Update puppet base position
    puppetBaseYRef.current += velocityRef.current.y * delta
    puppetBaseXRef.current += velocityRef.current.x * delta
    puppetBaseZRef.current += velocityRef.current.z * delta
    
    // Rigid stage collision - calculate actual foot positions and check collision
    const STAGE_Y = 0 // Stage surface is at y=0
    const FOOT_BOTTOM_OFFSET = -0.625 // Feet bottom is 0.625 below torso center
    
    // Calculate actual foot bottom positions in world space
    const leftFootWorldY = puppetBaseYRef.current + FOOT_BOTTOM_OFFSET
    const rightFootWorldY = puppetBaseYRef.current + FOOT_BOTTOM_OFFSET
    
    // Check if feet are hitting the stage
    const leftFootHitting = leftFootWorldY <= STAGE_Y
    const rightFootHitting = rightFootWorldY <= STAGE_Y
    const anyFootHitting = leftFootHitting || rightFootHitting
    
    // Rigid collision - stop falling when feet hit stage
    if (anyFootHitting) {
      // Calculate how much the feet are below the stage
      const penetration = Math.min(
        STAGE_Y - leftFootWorldY,
        STAGE_Y - rightFootWorldY
      )
      
      // Push puppet up to prevent penetration
      puppetBaseYRef.current += penetration
      
      // Stop downward velocity when hitting ground
      if (velocityRef.current.y < 0) {
        velocityRef.current.y = 0
      }
      
      // Apply knee bending when feet hit the stage
      // The more the puppet is compressed, the more knees bend
      const compressionAmount = Math.min(Math.abs(penetration) * 20, 1.0) // Scale penetration to 0-1
      
      // Store compression for knee bending (will be used below)
      if (leftFootHitting) {
        kneeBendRef.current.left = compressionAmount
      }
      if (rightFootHitting) {
        kneeBendRef.current.right = compressionAmount
      }
    } else {
      // Reset knee bend when feet are off ground
      kneeBendRef.current.left = 0
      kneeBendRef.current.right = 0
    }
    
    // Ceiling constraint - puppet can't fly too high (limited by string length)
    if (puppetBaseYRef.current > MAX_HEIGHT) {
      puppetBaseYRef.current = MAX_HEIGHT
      velocityRef.current.y = Math.min(0, velocityRef.current.y) // Can't have upward velocity at max height
    }
    
    // Horizontal constraints - puppet can't fly too far sideways
    const distanceFromCenter = Math.sqrt(puppetBaseXRef.current ** 2 + puppetBaseZRef.current ** 2)
    if (distanceFromCenter > MAX_HORIZONTAL_DISTANCE) {
      // Pull back towards center
      const angle = Math.atan2(puppetBaseZRef.current, puppetBaseXRef.current)
      puppetBaseXRef.current = Math.cos(angle) * MAX_HORIZONTAL_DISTANCE
      puppetBaseZRef.current = Math.sin(angle) * MAX_HORIZONTAL_DISTANCE
      // Dampen horizontal velocity
      velocityRef.current.x *= 0.5
      velocityRef.current.z *= 0.5
    }
    
    // Apply spring-like force to return to center (simulates string tension)
    const springForce = 0.3 // Spring constant
    velocityRef.current.x -= puppetBaseXRef.current * springForce * delta
    velocityRef.current.z -= puppetBaseZRef.current * springForce * delta
    
    // Update puppet group position
    groupRef.current.position.set(
      puppetBaseXRef.current,
      puppetBaseYRef.current,
      puppetBaseZRef.current
    )
    }

    if (!stringControls) return

    // Head: pulled up by head string, or sagged by gravity (flexible joints for both physics and kinematic)
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

    // Left Arm: pulled up by left hand string, or hangs down at rest (limb extends along -X, rotate to -Y)
    if (leftUpperArmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftUpperArmRef.current.rotation.z = -Math.PI / 2 + pull * 1.0 // Rest: -90° (arm down); pulled: swing up
      leftUpperArmRef.current.rotation.y = -pull * 0.6
      leftUpperArmRef.current.rotation.x = pull * 0.3
    } else if (leftUpperArmRef.current) {
      leftUpperArmRef.current.rotation.z = -Math.PI / 2 // Arm hangs straight down
      leftUpperArmRef.current.rotation.y = 0
      leftUpperArmRef.current.rotation.x = 0
    }
    // Left Elbow: visible bend at rest so joint is obvious
    if (leftForearmRef.current && stringControls.leftHand !== undefined) {
      const pull = stringControls.leftHand
      leftForearmRef.current.rotation.y = -pull * 0.8
    } else if (leftForearmRef.current) {
      leftForearmRef.current.rotation.y = 0.25 // Slight bend at rest so elbow is visible
    }

    // Right Arm: mirror of left
    if (rightUpperArmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightUpperArmRef.current.rotation.z = Math.PI / 2 - pull * 1.0
      rightUpperArmRef.current.rotation.y = pull * 0.6
      rightUpperArmRef.current.rotation.x = -pull * 0.3
    } else if (rightUpperArmRef.current) {
      rightUpperArmRef.current.rotation.z = Math.PI / 2
      rightUpperArmRef.current.rotation.y = 0
      rightUpperArmRef.current.rotation.x = 0
    }
    if (rightForearmRef.current && stringControls.rightHand !== undefined) {
      const pull = stringControls.rightHand
      rightForearmRef.current.rotation.y = pull * 0.8
    } else if (rightForearmRef.current) {
      rightForearmRef.current.rotation.y = -0.25
    }

    // Left Leg: pulled up by left foot string, or hangs down by gravity, or compresses when landing
    if (leftThighRef.current) {
      let thighRotationX = -0.1 // Default: slight forward lean
      let thighRotationZ = 0
      
      if (stringControls?.leftFoot !== undefined) {
        const pull = stringControls.leftFoot
        thighRotationX = pull * 0.8 - (1 - pull) * 0.1 // Lift when pulled, slight forward when relaxed
        thighRotationZ = pull * 0.2 // Rotate leg slightly when pulled
      }
      
      // Add compression when foot hits ground (thigh rotates forward more)
      thighRotationX += kneeBendRef.current.left * 0.3 // Compress thigh when landing
      
      leftThighRef.current.rotation.x = thighRotationX
      leftThighRef.current.rotation.z = thighRotationZ
    }
    // Left Knee: bends when leg is lifted, or when foot hits ground, or straightens when relaxed
    if (leftShinRef.current) {
      let kneeRotation = 0
      if (stringControls?.leftFoot !== undefined) {
        const pull = stringControls.leftFoot
        kneeRotation = pull * 0.6 - (1 - pull) * 0.1 // Bend when pulled, slight bend when relaxed
      } else {
        kneeRotation = -0.25 // Visible bend at rest so knee joint is obvious
      }
      kneeRotation += kneeBendRef.current.left * 0.8
      leftShinRef.current.rotation.x = kneeRotation
    }

    // Right Leg: pulled up by right foot string, or hangs down by gravity, or compresses when landing
    if (rightThighRef.current) {
      let thighRotationX = -0.1 // Default: slight forward lean
      let thighRotationZ = 0
      
      if (stringControls?.rightFoot !== undefined) {
        const pull = stringControls.rightFoot
        thighRotationX = pull * 0.8 - (1 - pull) * 0.1 // Lift when pulled, slight forward when relaxed
        thighRotationZ = -pull * 0.2 // Rotate leg slightly when pulled
      }
      
      // Add compression when foot hits ground (thigh rotates forward more)
      thighRotationX += kneeBendRef.current.right * 0.3 // Compress thigh when landing
      
      rightThighRef.current.rotation.x = thighRotationX
      rightThighRef.current.rotation.z = thighRotationZ
    }
    // Right Knee: bends when leg is lifted, or when foot hits ground, or straightens when relaxed
    if (rightShinRef.current) {
      let kneeRotation = 0
      if (stringControls?.rightFoot !== undefined) {
        const pull = stringControls.rightFoot
        kneeRotation = pull * 0.6 - (1 - pull) * 0.1 // Bend when pulled, slight bend when relaxed
      } else {
        kneeRotation = -0.25 // Visible bend at rest so knee joint is obvious
      }
      kneeRotation += kneeBendRef.current.right * 0.8
      rightShinRef.current.rotation.x = kneeRotation
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.625, 0]}>
      {/* Marionette strings */}
      <MarionetteStrings 
        puppetRef={groupRef} 
        controlBarRef={controlBarRef}
        stringControls={stringControls}
        puppetPosition={[0, 0.625, 0]}
        onStringPull={onStringPull}
        onPositionsChange={onPositionsChange}
        headRef={headRef}
        leftForearmRef={leftForearmRef}
        rightForearmRef={rightForearmRef}
        leftShinRef={leftShinRef}
        rightShinRef={rightShinRef}
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
          {/* Upper arm - cylinder extends horizontally (leftward along -X) */}
          <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
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
            {/* Forearm - cylinder extends horizontally (leftward along -X) */}
            <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
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
          {/* Upper arm - cylinder extends horizontally (rightward along +X) */}
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
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
            {/* Forearm - cylinder extends horizontally (rightward along +X) */}
            <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
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
