import * as THREE from 'three'

export interface StringConfig {
  name: string
  controlBarAttachment: THREE.Vector3 // World position where string attaches to control bar
  puppetAttachment: THREE.Vector3 // World position where string attaches to puppet
  restLength: number // Natural length when relaxed (meters)
  stiffness: number // Spring constant (N/m)
  damping: number // Damping coefficient (N·s/m)
}

export interface StringState {
  currentLength: number
  tension: number // Force magnitude (N)
  direction: THREE.Vector3 // Unit vector from puppet to control bar
  force: THREE.Vector3 // Force vector applied to puppet attachment point
}

/**
 * Calculate string physics: length, tension, and force
 */
export function calculateStringPhysics(config: StringConfig): StringState {
  // Calculate current string length
  const currentLength = config.controlBarAttachment.distanceTo(config.puppetAttachment)
  
  // Calculate direction from puppet to control bar (pulling direction)
  const direction = new THREE.Vector3()
    .subVectors(config.controlBarAttachment, config.puppetAttachment)
    .normalize()
  
  // Calculate extension (positive = stretched, negative = compressed)
  const extension = currentLength - config.restLength
  
  // Tension force: F = k * extension (Hooke's law)
  // Only applies when string is stretched (extension > 0)
  // Strings can't push, only pull
  const tension = extension > 0 ? config.stiffness * extension : 0
  
  // Apply damping based on velocity (simplified - would need velocity tracking for full damping)
  // For now, damping is applied as a reduction factor
  const dampingFactor = 1.0 / (1.0 + config.damping * 0.01)
  const effectiveTension = tension * dampingFactor
  
  // Force vector: magnitude * direction
  const force = direction.clone().multiplyScalar(effectiveTension)
  
  return {
    currentLength,
    tension: effectiveTension,
    direction,
    force,
  }
}

/**
 * Calculate all string physics for the marionette
 */
export function calculateAllStringPhysics(
  controlBarPos: THREE.Vector3,
  controlBarRot: THREE.Euler,
  puppetAttachmentPoints: {
    head: THREE.Vector3
    chest: THREE.Vector3
    leftHand: THREE.Vector3
    rightHand: THREE.Vector3
    leftShoulder: THREE.Vector3
    rightShoulder: THREE.Vector3
    leftFoot: THREE.Vector3
    rightFoot: THREE.Vector3
  }
): Map<string, StringState> {
  const results = new Map<string, StringState>()
  
  // Control bar attachment points in local space (matching marionette.xml)
  const controlBarLocalPoints = {
    center: new THREE.Vector3(0, 0, -0.20), // h_center
    left: new THREE.Vector3(-0.12, 0, 0), // h_left
    right: new THREE.Vector3(0.12, 0, 0), // h_right
    front: new THREE.Vector3(0, 0, 0.06), // h_front
    back: new THREE.Vector3(0, 0, -0.06), // h_back
  }
  
  // Transform control bar points to world space
  const controlBarQuat = new THREE.Quaternion().setFromEuler(controlBarRot)
  const controlBarWorldPoints = {
    center: controlBarLocalPoints.center.clone().applyQuaternion(controlBarQuat).add(controlBarPos),
    left: controlBarLocalPoints.left.clone().applyQuaternion(controlBarQuat).add(controlBarPos),
    right: controlBarLocalPoints.right.clone().applyQuaternion(controlBarQuat).add(controlBarPos),
    front: controlBarLocalPoints.front.clone().applyQuaternion(controlBarQuat).add(controlBarPos),
    back: controlBarLocalPoints.back.clone().applyQuaternion(controlBarQuat).add(controlBarPos),
  }
  
  // String configurations with rest lengths and stiffness (matching marionette.xml actuator settings)
  const stringConfigs: StringConfig[] = [
    {
      name: 'head',
      controlBarAttachment: controlBarWorldPoints.center,
      puppetAttachment: puppetAttachmentPoints.head,
      restLength: 1.5, // Approximate rest length (control bar at y=2.5, head at y~1.0)
      stiffness: 200, // kp from actuator
      damping: 5, // Damping coefficient
    },
    {
      name: 'chest',
      controlBarAttachment: controlBarWorldPoints.center,
      puppetAttachment: puppetAttachmentPoints.chest,
      restLength: 1.4,
      stiffness: 200,
      damping: 5,
    },
    {
      name: 'leftHand',
      controlBarAttachment: controlBarWorldPoints.left,
      puppetAttachment: puppetAttachmentPoints.leftHand,
      restLength: 1.6,
      stiffness: 200,
      damping: 4,
    },
    {
      name: 'rightHand',
      controlBarAttachment: controlBarWorldPoints.right,
      puppetAttachment: puppetAttachmentPoints.rightHand,
      restLength: 1.6,
      stiffness: 200,
      damping: 4,
    },
    {
      name: 'leftShoulder',
      controlBarAttachment: controlBarWorldPoints.front,
      puppetAttachment: puppetAttachmentPoints.leftShoulder,
      restLength: 1.5,
      stiffness: 150,
      damping: 4,
    },
    {
      name: 'rightShoulder',
      controlBarAttachment: controlBarWorldPoints.back,
      puppetAttachment: puppetAttachmentPoints.rightShoulder,
      restLength: 1.5,
      stiffness: 150,
      damping: 4,
    },
    {
      name: 'leftFoot',
      controlBarAttachment: controlBarWorldPoints.front,
      puppetAttachment: puppetAttachmentPoints.leftFoot,
      restLength: 1.8,
      stiffness: 250,
      damping: 6,
    },
    {
      name: 'rightFoot',
      controlBarAttachment: controlBarWorldPoints.back,
      puppetAttachment: puppetAttachmentPoints.rightFoot,
      restLength: 1.8,
      stiffness: 250,
      damping: 6,
    },
  ]
  
  // Calculate physics for each string
  for (const config of stringConfigs) {
    const state = calculateStringPhysics(config)
    results.set(config.name, state)
  }
  
  return results
}
