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
  onForcesTorquesChange?: (data: { forces: StringPositions; torques: StringPositions }) => void
  onStringLengthStateChange?: (selectedIndex: number | null, restLengths: Map<string, number>) => void
}

export default function PuppetScene({ command, onControlBarStateChange, onStringPositionsChange, onForcesTorquesChange, onStringLengthStateChange }: PuppetSceneProps) {
  const mujoco = useMuJoCo()
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
  
  // String length adjustment state
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null)
  const [stringRestLengths, setStringRestLengths] = useState<Map<string, number>>(new Map())
  
  // Map number keys (1-8) to string names
  const STRING_NAMES = ['head', 'chest', 'leftHand', 'rightHand', 'leftShoulder', 'rightShoulder', 'leftFoot', 'rightFoot'] as const
  const DEFAULT_REST_LENGTHS: Record<string, number> = {
    head: 1.5,
    chest: 1.4,
    leftHand: 1.6,
    rightHand: 1.6,
    leftShoulder: 1.5,
    rightShoulder: 1.5,
    leftFoot: 1.8,
    rightFoot: 1.8,
  }
  
  // Keyboard handlers for string length adjustment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-8: select string
      if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key) - 1
        setSelectedStringIndex(index)
        e.preventDefault()
        return
      }
      
      // +/- keys: adjust selected string length
      if (selectedStringIndex !== null) {
        const stringName = STRING_NAMES[selectedStringIndex]
        if (!stringName) return
        
        const currentLength = stringRestLengths.get(stringName) ?? DEFAULT_REST_LENGTHS[stringName]
        const adjustment = e.shiftKey ? 0.1 : 0.01 // Shift = larger steps
        
        if (e.key === '+' || e.key === '=') {
          setStringRestLengths(prev => {
            const next = new Map(prev)
            next.set(stringName, Math.min(currentLength + adjustment, 5.0)) // Max 5m
            return next
          })
          e.preventDefault()
        } else if (e.key === '-' || e.key === '_') {
          setStringRestLengths(prev => {
            const next = new Map(prev)
            next.set(stringName, Math.max(currentLength - adjustment, 0.1)) // Min 0.1m
            return next
          })
          e.preventDefault()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStringIndex, stringRestLengths])
  
  // Notify parent of string length state changes
  useEffect(() => {
    onStringLengthStateChange?.(selectedStringIndex, stringRestLengths)
  }, [selectedStringIndex, stringRestLengths, onStringLengthStateChange])
  
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

  // Initialize sequence start time on first frame after sequence is set
  useFrame((state) => {
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
        
        {/* Puppet - MuJoCo physics when loaded, else force-based physics */}
        <Puppet 
          mujoco={mujoco}
          stringControls={stringControls}
          controlBarRef={controlBarRef}
          controlBarPosition={controlBarState.position}
          controlBarRotation={controlBarState.rotation}
          onStringPull={handleStringPull}
          onPositionsChange={onStringPositionsChange}
          onForcesTorquesChange={onForcesTorquesChange}
          stringRestLengths={stringRestLengths}
        />
      </group>
    </>
  )
}
