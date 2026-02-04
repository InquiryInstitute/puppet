import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import PuppetScene from './components/PuppetScene'
import ControlBarDisplay from './components/ControlBarDisplay'
import CameraTracker from './components/CameraTracker'
import './App.css'

function App() {
  const [controlBarState, setControlBarState] = useState({
    position: { x: 0, y: 2.5, z: 0 },
    rotation: { roll: 0, pitch: 0, yaw: 0 }
  })
  
  const [cameraState, setCameraState] = useState<{
    position: { x: number; y: number; z: number }
    rotation: { roll: number; pitch: number; yaw: number }
  } | null>(null)

  return (
    <div className="app">
      <ControlBarDisplay 
        controlBarPosition={controlBarState.position}
        controlBarRotation={controlBarState.rotation}
        cameraPosition={cameraState?.position}
        cameraRotation={cameraState?.rotation}
      />
      <div className="canvas-container">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 2, 5]} />
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
