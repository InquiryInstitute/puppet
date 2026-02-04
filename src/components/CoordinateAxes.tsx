import { useRef, useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface CoordinateAxesProps {
  position?: [number, number, number]
  size?: number
  showLabels?: boolean
  showRotationArrows?: boolean
}

export default function CoordinateAxes({ 
  position = [0, 0, 0],
  size = 1,
  showLabels = true,
  showRotationArrows = true
}: CoordinateAxesProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Create arrow helpers using useMemo
  const xArrow = useMemo(() => {
    const helper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      size,
      0xff0000,
      size * 0.1,
      size * 0.05
    )
    return helper
  }, [size])

  const yArrow = useMemo(() => {
    const helper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      size,
      0x00ff00,
      size * 0.1,
      size * 0.05
    )
    return helper
  }, [size])

  const zArrow = useMemo(() => {
    const helper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      size,
      0x0000ff,
      size * 0.1,
      size * 0.05
    )
    return helper
  }, [size])

  // Rotation arrow (circular) helpers
  const rotationArrows = useMemo(() => {
    if (!showRotationArrows) return null
    
    const arrows: { x: THREE.Group, y: THREE.Group, z: THREE.Group } = {
      x: new THREE.Group(),
      y: new THREE.Group(),
      z: new THREE.Group()
    }
    
    const radius = size * 0.3
    const segments = 32
    
    // X rotation (around X axis) - circle in YZ plane
    const xPoints: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      xPoints.push(new THREE.Vector3(0, Math.cos(angle) * radius, Math.sin(angle) * radius))
    }
    const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
    arrows.x.add(new THREE.Line(xGeometry, xMaterial))
    
    // Y rotation (around Y axis) - circle in XZ plane
    const yPoints: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      yPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    arrows.y.add(new THREE.Line(yGeometry, yMaterial))
    
    // Z rotation (around Z axis) - circle in XY plane
    const zPoints: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      zPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0))
    }
    const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 })
    arrows.z.add(new THREE.Line(zGeometry, zMaterial))
    
    return arrows
  }, [size, showRotationArrows])

  return (
    <group ref={groupRef} position={position}>
      {/* X axis - Red */}
      <primitive object={xArrow} />
      {showLabels && (
        <Text
          position={[size * 1.1, 0, 0]}
          fontSize={size * 0.15}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
        >
          X
        </Text>
      )}

      {/* Y axis - Green */}
      <primitive object={yArrow} />
      {showLabels && (
        <Text
          position={[0, size * 1.1, 0]}
          fontSize={size * 0.15}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          Y
        </Text>
      )}

      {/* Z axis - Blue */}
      <primitive object={zArrow} />
      {showLabels && (
        <Text
          position={[0, 0, size * 1.1]}
          fontSize={size * 0.15}
          color="#0000ff"
          anchorX="center"
          anchorY="middle"
        >
          Z
        </Text>
      )}

      {/* Rotation arrows */}
      {rotationArrows && (
        <>
          <primitive object={rotationArrows.x} />
          <primitive object={rotationArrows.y} />
          <primitive object={rotationArrows.z} />
        </>
      )}
    </group>
  )
}
