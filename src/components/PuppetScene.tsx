import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Puppet from './Puppet'
import MarionetteControl from './MarionetteControl'
import { useMuJoCo } from '../mujoco/useMuJoCo'
import { useLLMController } from '../llm/useLLMController'

interface PuppetSceneProps {
  command: string
  isExecuting: boolean
}

export default function PuppetScene({ command }: PuppetSceneProps) {
  const { model, scene, step } = useMuJoCo()
  const { executeCommand, currentSequence, isProcessing } = useLLMController()
  const puppetRef = useRef<THREE.Group>(null)
  const controlBarRef = useRef<THREE.Group>(null)
  const [sequenceStartTime, setSequenceStartTime] = useState<number | null>(null)
  const [stringControls, setStringControls] = useState<{
    head: number
    leftHand: number
    rightHand: number
    torso?: number
    leftFoot?: number
    rightFoot?: number
  }>({
    head: 0,
    leftHand: 0,
    rightHand: 0,
  })
  const lastCommandRef = useRef<string>('')

  // Execute command when it changes
  useEffect(() => {
    if (command && command !== lastCommandRef.current && !isProcessing) {
      lastCommandRef.current = command
      console.log('PuppetScene: Executing command', command)
      executeCommand(command)
    }
  }, [command, isProcessing, executeCommand])

  // Reset sequence start time when a new sequence arrives
  useEffect(() => {
    if (currentSequence) {
      setSequenceStartTime(null) // Will be set on first frame
    }
  }, [currentSequence])

  // Update puppet based on MuJoCo simulation
  useFrame((state) => {
    if (model && scene && puppetRef.current) {
      step()
      // Update puppet position/rotation from MuJoCo state
      // This will be implemented based on MuJoCo API
    }

    // Initialize sequence start time on first frame after sequence is set
    if (currentSequence && sequenceStartTime === null) {
      setSequenceStartTime(state.clock.elapsedTime)
    }
  })

  return (
    <group ref={puppetRef}>
      {/* Interactive marionette control crossbar */}
      <group ref={controlBarRef}>
        <MarionetteControl
          position={[0, 1.5, 0]}
          onStringControlsChange={setStringControls}
          stringCount={8}
          controlSequence={currentSequence ? {
            steps: currentSequence.steps.map(step => ({
              startTime: step.startTime,
              duration: step.duration,
              // Convert puppet part rotations to crossbar movements
              position: step.rotations.torso ? [
                0,
                1.5 - (step.rotations.torso.x || 0) * 0.3, // Lower crossbar to pull torso
                0
              ] : undefined,
              rotation: step.rotations.head || step.rotations.torso ? [
                (step.rotations.torso?.x || 0) * 0.5, // Tilt forward/back
                0,
                (step.rotations.head?.y || 0) * 0.3 // Tilt sideways
              ] : undefined
            })),
            totalDuration: currentSequence.totalDuration
          } : undefined}
          sequenceStartTime={sequenceStartTime ?? undefined}
        />
      </group>
      
      {/* Puppet - only responds to strings, not direct animation */}
      <Puppet 
        stringControls={stringControls}
        controlBarRef={controlBarRef}
      />
    </group>
  )
}
