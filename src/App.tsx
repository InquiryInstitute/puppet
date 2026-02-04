import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import PuppetScene from './components/PuppetScene'
import './App.css'

function App() {
  const [cameraControlsEnabled, setCameraControlsEnabled] = useState(false)

  // Enable camera controls when Option/Cmd key is held
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) {
        setCameraControlsEnabled(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && !e.metaKey) {
        setCameraControlsEnabled(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="app">
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
          <PuppetScene command="" isExecuting={false} />
          <OrbitControls
            enabled={cameraControlsEnabled}
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
