import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Puppet from './Puppet'
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
  const [stringControls] = useState<{
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
      {/* Simple control bar (just a visual reference for strings) */}
      <group ref={controlBarRef} position={[0, 1.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>
      
      {/* Puppet */}
      <Puppet 
        sequence={currentSequence ?? undefined} 
        sequenceStartTime={sequenceStartTime ?? undefined}
        stringControls={stringControls}
        controlBarRef={controlBarRef}
      />
    </group>
  )
}
