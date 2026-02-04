export interface Rotation {
  x?: number
  y?: number
  z?: number
}

export interface BodyRotations {
  head?: Rotation
  torso?: Rotation
  leftArm?: Rotation
  rightArm?: Rotation
  leftLeg?: Rotation
  rightLeg?: Rotation
}

export interface MotionStep {
  startTime: number
  duration: number
  rotations: BodyRotations
  stringControls?: {
    head?: number // String length/position
    leftHand?: number
    rightHand?: number
    leftFoot?: number
    rightFoot?: number
  }
}

export interface MotionSequence {
  steps: MotionStep[]
  totalDuration: number
}

export interface LLMResponse {
  sequence: MotionSequence
  description: string
}
