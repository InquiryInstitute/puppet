import * as THREE from 'three'
import { StringState } from './stringPhysics'
import { JointState, JointConfig, applyForceToJoint, convertStringForceToJointTorque } from './jointPhysics'

export interface PuppetPhysicsState {
  // Joint states
  head: JointState
  torso: JointState
  leftShoulder: JointState
  rightShoulder: JointState
  leftElbow: JointState
  rightElbow: JointState
  leftHip: JointState
  rightHip: JointState
  leftKnee: JointState
  rightKnee: JointState
}

export interface PuppetPhysicsConfig {
  // Joint configurations
  head: JointConfig
  torso: JointConfig
  leftShoulder: JointConfig
  rightShoulder: JointConfig
  leftElbow: JointConfig
  rightElbow: JointConfig
  leftHip: JointConfig
  rightHip: JointConfig
  leftKnee: JointConfig
  rightKnee: JointConfig
}

/**
 * Initialize puppet physics state
 */
export function initializePuppetPhysics(): PuppetPhysicsState {
  const createJointState = (pos: THREE.Vector3, rot: THREE.Euler): JointState => ({
    position: pos.clone(),
    rotation: rot.clone(),
    velocity: new THREE.Vector3(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    force: new THREE.Vector3(0, 0, 0),
    torque: new THREE.Vector3(0, 0, 0),
  })

  return {
    head: createJointState(new THREE.Vector3(0, 0.4, 0), new THREE.Euler(0, 0, 0)),
    torso: createJointState(new THREE.Vector3(0, 0, 0), new THREE.Euler(0, 0, 0)),
    leftShoulder: createJointState(new THREE.Vector3(-0.15, 0.1, 0), new THREE.Euler(0, 0, 0)),
    rightShoulder: createJointState(new THREE.Vector3(0.15, 0.1, 0), new THREE.Euler(0, 0, 0)),
    leftElbow: createJointState(new THREE.Vector3(-0.18, 0, 0), new THREE.Euler(0, 0, 0)),
    rightElbow: createJointState(new THREE.Vector3(0.18, 0, 0), new THREE.Euler(0, 0, 0)),
    leftHip: createJointState(new THREE.Vector3(-0.1, -0.2, 0), new THREE.Euler(0, 0, 0)),
    rightHip: createJointState(new THREE.Vector3(0.1, -0.2, 0), new THREE.Euler(0, 0, 0)),
    leftKnee: createJointState(new THREE.Vector3(0, -0.2, 0), new THREE.Euler(0, 0, 0)),
    rightKnee: createJointState(new THREE.Vector3(0, -0.2, 0), new THREE.Euler(0, 0, 0)),
  }
}

/**
 * Create default joint configurations
 */
export function createDefaultJointConfigs(): PuppetPhysicsConfig {
  const createJointConfig = (
    mass: number,
    inertia: THREE.Vector3,
    damping: number = 0.1,
    maxAngularVelocity: number = 5.0
  ): JointConfig => ({
    name: '',
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    mass,
    inertia,
    damping,
    maxAngularVelocity,
  })

  return {
    head: createJointConfig(0.2, new THREE.Vector3(0.01, 0.01, 0.01), 0.15, 3.0),
    torso: createJointConfig(1.0, new THREE.Vector3(0.05, 0.05, 0.05), 0.2, 2.0),
    leftShoulder: createJointConfig(0.15, new THREE.Vector3(0.005, 0.005, 0.005), 0.12, 4.0),
    rightShoulder: createJointConfig(0.15, new THREE.Vector3(0.005, 0.005, 0.005), 0.12, 4.0),
    leftElbow: createJointConfig(0.1, new THREE.Vector3(0.003, 0.003, 0.003), 0.1, 5.0),
    rightElbow: createJointConfig(0.1, new THREE.Vector3(0.003, 0.003, 0.003), 0.1, 5.0),
    leftHip: createJointConfig(0.2, new THREE.Vector3(0.008, 0.008, 0.008), 0.15, 3.0),
    rightHip: createJointConfig(0.2, new THREE.Vector3(0.008, 0.008, 0.008), 0.15, 3.0),
    leftKnee: createJointConfig(0.15, new THREE.Vector3(0.005, 0.005, 0.005), 0.12, 4.0),
    rightKnee: createJointConfig(0.15, new THREE.Vector3(0.005, 0.005, 0.005), 0.12, 4.0),
  }
}

/**
 * Apply string forces to puppet joints
 * Forces propagate up the hierarchy: child forces pull on parents
 */
export function applyStringForcesToJoints(
  stringStates: Map<string, StringState>,
  physicsState: PuppetPhysicsState,
  _config: PuppetPhysicsConfig,
  puppetBasePosition: THREE.Vector3,
  puppetBaseRotation: THREE.Euler
): void {
  // Transform puppet base to world space
  const baseQuat = new THREE.Quaternion().setFromEuler(puppetBaseRotation)
  
  // Helper to get world position of a joint
  const getWorldPosition = (localPos: THREE.Vector3): THREE.Vector3 => {
    return localPos.clone().applyQuaternion(baseQuat).add(puppetBasePosition)
  }

  // Apply head string force to head
  // Head is connected to torso, so this force will pull the torso (and whole puppet)
  const headString = stringStates.get('head')
  if (headString) {
    const headWorldPos = getWorldPosition(physicsState.head.position)
    const { force, torque } = convertStringForceToJointTorque(
      headString.force,
      headWorldPos,
      headWorldPos,
      physicsState.head.rotation
    )
    physicsState.head.force.add(force)
    physicsState.head.torque.add(torque)
    
    // Propagate force to torso (parent): pulling head pulls the whole body
    // The head force should pull the torso, which moves the whole puppet
    physicsState.torso.force.add(force.clone().multiplyScalar(0.8)) // 80% of head force propagates to torso
  }

  // Apply chest string force to torso
  const chestString = stringStates.get('chest')
  if (chestString) {
    const torsoWorldPos = getWorldPosition(physicsState.torso.position)
    const { force, torque } = convertStringForceToJointTorque(
      chestString.force,
      torsoWorldPos,
      torsoWorldPos,
      physicsState.torso.rotation
    )
    physicsState.torso.force.add(force)
    physicsState.torso.torque.add(torque)
  }

  // Apply left hand string force to left elbow (end of arm chain)
  // Force propagates: elbow → shoulder → torso
  const leftHandString = stringStates.get('leftHand')
  if (leftHandString) {
    const leftElbowWorldPos = getWorldPosition(physicsState.leftElbow.position)
    const { force, torque } = convertStringForceToJointTorque(
      leftHandString.force,
      leftElbowWorldPos,
      leftElbowWorldPos,
      physicsState.leftElbow.rotation
    )
    physicsState.leftElbow.force.add(force)
    physicsState.leftElbow.torque.add(torque)
    
    // Propagate to shoulder (parent)
    physicsState.leftShoulder.force.add(force.clone().multiplyScalar(0.7))
    // Propagate to torso (grandparent)
    physicsState.torso.force.add(force.clone().multiplyScalar(0.5))
  }

  // Apply right hand string force to right elbow
  // Force propagates: elbow → shoulder → torso
  const rightHandString = stringStates.get('rightHand')
  if (rightHandString) {
    const rightElbowWorldPos = getWorldPosition(physicsState.rightElbow.position)
    const { force, torque } = convertStringForceToJointTorque(
      rightHandString.force,
      rightElbowWorldPos,
      rightElbowWorldPos,
      physicsState.rightElbow.rotation
    )
    physicsState.rightElbow.force.add(force)
    physicsState.rightElbow.torque.add(torque)
    
    // Propagate to shoulder (parent)
    physicsState.rightShoulder.force.add(force.clone().multiplyScalar(0.7))
    // Propagate to torso (grandparent)
    physicsState.torso.force.add(force.clone().multiplyScalar(0.5))
  }

  // Apply left shoulder string force
  // Force propagates: shoulder → torso
  const leftShoulderString = stringStates.get('leftShoulder')
  if (leftShoulderString) {
    const leftShoulderWorldPos = getWorldPosition(physicsState.leftShoulder.position)
    const { force, torque } = convertStringForceToJointTorque(
      leftShoulderString.force,
      leftShoulderWorldPos,
      leftShoulderWorldPos,
      physicsState.leftShoulder.rotation
    )
    physicsState.leftShoulder.force.add(force)
    physicsState.leftShoulder.torque.add(torque)
    
    // Propagate to torso (parent)
    physicsState.torso.force.add(force.clone().multiplyScalar(0.8))
  }

  // Apply right shoulder string force
  // Force propagates: shoulder → torso
  const rightShoulderString = stringStates.get('rightShoulder')
  if (rightShoulderString) {
    const rightShoulderWorldPos = getWorldPosition(physicsState.rightShoulder.position)
    const { force, torque } = convertStringForceToJointTorque(
      rightShoulderString.force,
      rightShoulderWorldPos,
      rightShoulderWorldPos,
      physicsState.rightShoulder.rotation
    )
    physicsState.rightShoulder.force.add(force)
    physicsState.rightShoulder.torque.add(torque)
    
    // Propagate to torso (parent)
    physicsState.torso.force.add(force.clone().multiplyScalar(0.8))
  }

  // Apply left foot string force to left knee
  const leftFootString = stringStates.get('leftFoot')
  if (leftFootString) {
    const leftKneeWorldPos = getWorldPosition(physicsState.leftKnee.position)
    const { force, torque } = convertStringForceToJointTorque(
      leftFootString.force,
      leftKneeWorldPos,
      leftKneeWorldPos,
      physicsState.leftKnee.rotation
    )
    physicsState.leftKnee.force.add(force)
    physicsState.leftKnee.torque.add(torque)
  }

  // Apply right foot string force to right knee
  const rightFootString = stringStates.get('rightFoot')
  if (rightFootString) {
    const rightKneeWorldPos = getWorldPosition(physicsState.rightKnee.position)
    const { force, torque } = convertStringForceToJointTorque(
      rightFootString.force,
      rightKneeWorldPos,
      rightKneeWorldPos,
      physicsState.rightKnee.rotation
    )
    physicsState.rightKnee.force.add(force)
    physicsState.rightKnee.torque.add(torque)
  }
}

/**
 * Apply gravity to all joints
 */
export function applyGravity(
  physicsState: PuppetPhysicsState,
  gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81 * 0.15, 0)
): void {
  // Apply gravity to all joints (proportional to mass)
  const joints = Object.values(physicsState)
  for (const joint of joints) {
    // Gravity force = mass * gravity (simplified - using average mass)
    const mass = 0.2 // Average joint mass
    const gravityForce = gravity.clone().multiplyScalar(mass)
    joint.force.add(gravityForce)
  }
}

/**
 * Step physics simulation
 */
export function stepPuppetPhysics(
  physicsState: PuppetPhysicsState,
  config: PuppetPhysicsConfig,
  deltaTime: number
): void {
  // Apply forces to each joint and integrate
  applyForceToJoint(physicsState.head, config.head, physicsState.head.force, physicsState.head.torque, deltaTime)
  applyForceToJoint(physicsState.torso, config.torso, physicsState.torso.force, physicsState.torso.torque, deltaTime)
  applyForceToJoint(physicsState.leftShoulder, config.leftShoulder, physicsState.leftShoulder.force, physicsState.leftShoulder.torque, deltaTime)
  applyForceToJoint(physicsState.rightShoulder, config.rightShoulder, physicsState.rightShoulder.force, physicsState.rightShoulder.torque, deltaTime)
  applyForceToJoint(physicsState.leftElbow, config.leftElbow, physicsState.leftElbow.force, physicsState.leftElbow.torque, deltaTime)
  applyForceToJoint(physicsState.rightElbow, config.rightElbow, physicsState.rightElbow.force, physicsState.rightElbow.torque, deltaTime)
  applyForceToJoint(physicsState.leftHip, config.leftHip, physicsState.leftHip.force, physicsState.leftHip.torque, deltaTime)
  applyForceToJoint(physicsState.rightHip, config.rightHip, physicsState.rightHip.force, physicsState.rightHip.torque, deltaTime)
  applyForceToJoint(physicsState.leftKnee, config.leftKnee, physicsState.leftKnee.force, physicsState.leftKnee.torque, deltaTime)
  applyForceToJoint(physicsState.rightKnee, config.rightKnee, physicsState.rightKnee.force, physicsState.rightKnee.torque, deltaTime)
}
