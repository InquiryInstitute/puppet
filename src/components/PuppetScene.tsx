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

export default function PuppetScene({ command, isExecuting }: PuppetSceneProps) {
  const { model, scene, step } = useMuJoCo()
  const { executeCommand, currentSequence } = useLLMController()
  const puppetRef = useRef<THREE.Group>(null)
  const [sequenceStartTime, setSequenceStartTime] = useState<number | null>(null)

  // Execute command when it changes
  useEffect(() => {
    if (command && !isExecuting) {
      executeCommand(command)
    }
  }, [command, isExecuting, executeCommand])

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
      <Puppet 
        sequence={currentSequence} 
        sequenceStartTime={sequenceStartTime}
      />
    </group>
  )
}
