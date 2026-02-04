import * as THREE from 'three'

export interface JointState {
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
  force: THREE.Vector3
  torque: THREE.Vector3
}

export interface JointConfig {
  name: string
  position: THREE.Vector3
  rotation: THREE.Euler
  mass: number
  inertia: THREE.Vector3 // Moment of inertia (simplified as vector)
  damping: number
  maxAngularVelocity: number
}

/**
 * Apply force to a joint and integrate to compute new position/rotation
 */
export function applyForceToJoint(
  joint: JointState,
  config: JointConfig,
  force: THREE.Vector3,
  torque: THREE.Vector3,
  deltaTime: number
): JointState {
  // Apply damping
  joint.velocity.multiplyScalar(1.0 - config.damping * deltaTime)
  joint.angularVelocity.multiplyScalar(1.0 - config.damping * deltaTime)
  
  // Apply forces (F = ma, so a = F/m)
  const acceleration = force.clone().divideScalar(config.mass)
  joint.velocity.add(acceleration.clone().multiplyScalar(deltaTime))
  
  // Apply torques (τ = Iα, so α = τ/I)
  const angularAcceleration = new THREE.Vector3(
    torque.x / config.inertia.x,
    torque.y / config.inertia.y,
    torque.z / config.inertia.z
  )
  joint.angularVelocity.add(angularAcceleration.clone().multiplyScalar(deltaTime))
  
  // Clamp angular velocity
  const angularSpeed = joint.angularVelocity.length()
  if (angularSpeed > config.maxAngularVelocity) {
    joint.angularVelocity.normalize().multiplyScalar(config.maxAngularVelocity)
  }
  
  // Integrate position
  joint.position.add(joint.velocity.clone().multiplyScalar(deltaTime))
  
  // Integrate rotation
  const rotationDelta = new THREE.Euler(
    joint.angularVelocity.x * deltaTime,
    joint.angularVelocity.y * deltaTime,
    joint.angularVelocity.z * deltaTime
  )
  const currentQuat = new THREE.Quaternion().setFromEuler(joint.rotation)
  const deltaQuat = new THREE.Quaternion().setFromEuler(rotationDelta)
  const newQuat = currentQuat.multiply(deltaQuat)
  joint.rotation.setFromQuaternion(newQuat)
  
  // Reset forces for next frame
  joint.force.set(0, 0, 0)
  joint.torque.set(0, 0, 0)
  
  return joint
}

/**
 * Convert string force to joint force and torque
 */
export function convertStringForceToJointTorque(
  stringForce: THREE.Vector3,
  attachmentPoint: THREE.Vector3,
  jointPosition: THREE.Vector3,
  jointRotation: THREE.Euler
): { force: THREE.Vector3; torque: THREE.Vector3 } {
  // Force is applied at attachment point
  const force = stringForce.clone()
  
  // Torque = r × F, where r is vector from joint to attachment point
  const r = attachmentPoint.clone().sub(jointPosition)
  const torque = new THREE.Vector3().crossVectors(r, force)
  
  // Transform torque to joint's local space
  const jointQuat = new THREE.Quaternion().setFromEuler(jointRotation)
  const inverseQuat = jointQuat.clone().invert()
  torque.applyQuaternion(inverseQuat)
  
  return { force, torque }
}
