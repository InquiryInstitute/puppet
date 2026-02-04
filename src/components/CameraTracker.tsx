import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraTrackerProps {
  onCameraStateChange: (position: { x: number; y: number; z: number }, rotation: { roll: number; pitch: number; yaw: number }) => void
}

export default function CameraTracker({ onCameraStateChange }: CameraTrackerProps) {
  const { camera } = useThree()

  useFrame(() => {
    // Get camera position
    const position = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    }

    // Get camera rotation as Euler angles
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion)
    
    // Convert to roll/pitch/yaw
    // In Three.js: Euler.x = pitch, Euler.y = yaw, Euler.z = roll
    const rotation = {
      roll: euler.z,   // Rotation around Z axis
      pitch: euler.x,  // Rotation around X axis
      yaw: euler.y     // Rotation around Y axis
    }

    onCameraStateChange(position, rotation)
  })

  return null // This component doesn't render anything
}
