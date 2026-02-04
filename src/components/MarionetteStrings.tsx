import { useMemo } from 'react'
import * as THREE from 'three'

interface MarionetteStringsProps {
  puppetRef: React.RefObject<THREE.Group>
}

export default function MarionetteStrings({ puppetRef }: MarionetteStringsProps) {
  const strings = useMemo(() => {
    if (!puppetRef.current) return null

    const stringPositions = [
      // Head string
      { start: [0, 0.5, 0], end: [0, 1.5, 0] },
      // Left hand string
      { start: [-0.25, -0.08, 0], end: [-0.25, 1.2, 0] },
      // Right hand string
      { start: [0.25, -0.08, 0], end: [0.25, 1.2, 0] },
      // Left foot string
      { start: [-0.1, -0.5, 0], end: [-0.1, 1.0, 0] },
      // Right foot string
      { start: [0.1, -0.5, 0], end: [0.1, 1.0, 0] },
    ]

    return stringPositions.map((pos, idx) => {
      const points = [
        new THREE.Vector3(...pos.start),
        new THREE.Vector3(...pos.end),
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      return (
        <line key={idx} geometry={geometry}>
          <lineBasicMaterial
            color="#888888"
            opacity={0.5}
            transparent
            linewidth={1}
          />
        </line>
      )
    })
  }, [puppetRef])

  return <group>{strings}</group>
}
