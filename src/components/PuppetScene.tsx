import { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Puppet from './Puppet'
import MarionetteControl from './MarionetteControl'
import CoordinateAxes from './CoordinateAxes'
import { useMuJoCo } from '../mujoco/useMuJoCo'
import { useLLMController } from '../llm/useLLMController'
import { createWoodTexture } from '../utils/woodTexture'
import { createCurtainTexture } from '../utils/curtainTexture'

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

interface PuppetSceneProps {
  command: string
  isExecuting: boolean
  onControlBarStateChange?: (position: { x: number; y: number; z: number }, rotation: { roll: number; pitch: number; yaw: number }) => void
  onStringPositionsChange?: (positions: {
    controller: StringPositions
    stringStart: StringPositions
    stringEnd: StringPositions
    puppet: StringPositions
  }) => void
}

export default function PuppetScene({ command, onControlBarStateChange, onStringPositionsChange }: PuppetSceneProps) {
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
  const [controlBarState, setControlBarState] = useState<{
    position: { x: number; y: number; z: number }
    rotation: { roll: number; pitch: number; yaw: number }
  }>({
    position: { x: 0, y: 2.5, z: 0 },
    rotation: { roll: 0, pitch: 0, yaw: 0 },
  })
  const lastCommandRef = useRef<string>('')
  
  // Create wood texture for stage
  const woodTexture = useMemo(() => createWoodTexture(), [])
  // Create red curtain texture for backdrop
  const curtainTexture = useMemo(() => createCurtainTexture(1024, 512), [])

  // Handle direct string pulling
  const handleStringPull = (stringName: string, pullAmount: number) => {
    setStringControls(prev => {
      const updated = { ...prev }
      // Map string names to control properties
      switch (stringName) {
        case 'head':
          updated.head = pullAmount
          break
        case 'chest':
          updated.torso = pullAmount
          break
        case 'leftHand':
          updated.leftHand = pullAmount
          break
        case 'rightHand':
          updated.rightHand = pullAmount
          break
        case 'leftShoulder':
          updated.torso = Math.max(updated.torso || 0, pullAmount * 0.5)
          break
        case 'rightShoulder':
          updated.torso = Math.max(updated.torso || 0, pullAmount * 0.5)
          break
        case 'leftFoot':
          updated.leftFoot = pullAmount
          break
        case 'rightFoot':
          updated.rightFoot = pullAmount
          break
      }
      return updated
    })
  }

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
    <>
      {/* Coordinate axes at origin for reference */}
      <CoordinateAxes position={[0, 0.1, 0]} size={0.3} showLabels={true} showRotationArrows={true} />
      
      {/* Coordinate axes at control bar position */}
      <CoordinateAxes position={[0, 2.5, 0]} size={0.2} showLabels={true} showRotationArrows={false} />
      
      {/* Stage surface with wood texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial 
          map={woodTexture}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      
      {/* Stage backdrop - red curtain */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial 
          map={curtainTexture}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      <group ref={puppetRef}>
        {/* Interactive marionette control crossbar */}
        <MarionetteControl
          position={[0, 2.5, 0]}
          onStringControlsChange={setStringControls}
          onPositionRotationChange={(pos, rot) => {
            setControlBarState({ position: pos, rotation: rot })
            onControlBarStateChange?.(pos, rot)
          }}
          stringCount={8}
          controlBarRef={controlBarRef}
          controlSequence={currentSequence ? {
            steps: currentSequence.steps.map(step => ({
              startTime: step.startTime,
              duration: step.duration,
              // Convert puppet part rotations to crossbar movements
              position: step.rotations.torso ? [
                0,
                2.5 - (step.rotations.torso.x || 0) * 0.3, // Lower crossbar to pull torso
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
        
        {/* Puppet - force-based physics driven by string tensions */}
        <Puppet 
          stringControls={stringControls}
          controlBarRef={controlBarRef}
          controlBarPosition={controlBarState.position}
          controlBarRotation={controlBarState.rotation}
          onStringPull={handleStringPull}
          onPositionsChange={onStringPositionsChange}
        />
      </group>
    </>
  )
}
