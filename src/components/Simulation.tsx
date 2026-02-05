import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import PuppetScene from './PuppetScene'
import ControlBarDisplay from './ControlBarDisplay'
import CameraTracker from './CameraTracker'
import StringPositionsDisplay from './StringPositionsDisplay'
import '../App.css'

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

export default function Simulation() {
  const [controlBarState, setControlBarState] = useState({
    position: { x: 0, y: 2.5, z: 0 },
    rotation: { roll: 0, pitch: 0, yaw: 0 }
  })
  
  const [cameraState, setCameraState] = useState<{
    position: { x: number; y: number; z: number }
    rotation: { roll: number; pitch: number; yaw: number }
  } | null>(null)

  const [stringPositions, setStringPositions] = useState<{
    controller?: StringPositions
    stringStart?: StringPositions
    stringEnd?: StringPositions
    puppet?: StringPositions
  }>({})

  const [forcesTorques, setForcesTorques] = useState<{
    forces?: StringPositions
    torques?: StringPositions
  }>({})

  const [timing, setTiming] = useState<{
    simTime: number
    realTime: number
    fps: number
    realtimeRatio: number
  } | null>(null)

  const [stringLengthState, setStringLengthState] = useState<{
    selectedIndex: number | null
    restLengths: Map<string, number>
  }>({ selectedIndex: null, restLengths: new Map() })

  return (
    <div className="app">
      <ControlBarDisplay 
        controlBarPosition={controlBarState.position}
        controlBarRotation={controlBarState.rotation}
        cameraPosition={cameraState?.position}
        cameraRotation={cameraState?.rotation}
        timing={timing}
      />
      <StringPositionsDisplay
        controllerPositions={stringPositions.controller}
        stringStartPositions={stringPositions.stringStart}
        stringEndPositions={stringPositions.stringEnd}
        puppetPositions={stringPositions.puppet}
        forces={forcesTorques.forces}
        torques={forcesTorques.torques}
        selectedStringIndex={stringLengthState.selectedIndex}
        stringRestLengths={stringLengthState.restLengths}
      />
      <div className="canvas-container">
        <Canvas shadows>
          <PerspectiveCamera 
            makeDefault 
            position={[-0.08, 1.32, 3.95]}
            rotation={[0.0471, -0.0227, 0.001745]} // Pitch: 2.7°, Yaw: -1.3°, Roll: 0.1° (converted to radians)
          />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <PuppetScene 
            command="" 
            isExecuting={false}
            onControlBarStateChange={(pos, rot) => setControlBarState({ position: pos, rotation: rot })}
            onStringPositionsChange={(positions) => setStringPositions({
              controller: positions.controller,
              stringStart: positions.stringStart,
              stringEnd: positions.stringEnd,
              puppet: positions.puppet
            })}
            onForcesTorquesChange={(data) => setForcesTorques({ forces: data.forces, torques: data.torques })}
            onTimingUpdate={setTiming}
            onStringLengthStateChange={(selectedIndex, restLengths) =>
              setStringLengthState({ selectedIndex, restLengths })
            }
          />
          <CameraTracker 
            onCameraStateChange={(pos, rot) => setCameraState({ position: pos, rotation: rot })}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
          />
        </Canvas>
      </div>
    </div>
  )
}
