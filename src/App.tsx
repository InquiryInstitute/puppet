import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import PuppetScene from './components/PuppetScene'
import ControlBarDisplay from './components/ControlBarDisplay'
import CameraTracker from './components/CameraTracker'
import StringPositionsDisplay from './components/StringPositionsDisplay'
import './App.css'

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

function App() {
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

  return (
    <div className="app">
      <ControlBarDisplay 
        controlBarPosition={controlBarState.position}
        controlBarRotation={controlBarState.rotation}
        cameraPosition={cameraState?.position}
        cameraRotation={cameraState?.rotation}
      />
      <StringPositionsDisplay
        controllerPositions={stringPositions.controller}
        stringStartPositions={stringPositions.stringStart}
        stringEndPositions={stringPositions.stringEnd}
        puppetPositions={stringPositions.puppet}
      />
      <div className="canvas-container">
        <Canvas shadows>
          <PerspectiveCamera 
            makeDefault 
            position={[0.02, 2.85, 4.67]}
            rotation={[-0.176, -0.007, -0.002]} // Pitch: -10.1°, Yaw: -0.4°, Roll: -0.1° (converted to radians)
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

export default App
