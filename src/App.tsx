import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei'
import PuppetScene from './components/PuppetScene'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const [command, setCommand] = useState('')
  const [isExecuting] = useState(false) // Managed by PuppetScene

  const handleCommand = async (cmd: string) => {
    setCommand(cmd)
    // isExecuting will be managed by PuppetScene via useLLMController
  }

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
          <Grid args={[10, 10]} cellColor="#333" sectionColor="#222" />
          <PuppetScene command={command} isExecuting={isExecuting} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={20}
          />
        </Canvas>
      </div>
      <ControlPanel onCommand={handleCommand} isExecuting={isExecuting} />
    </div>
  )
}

export default App
