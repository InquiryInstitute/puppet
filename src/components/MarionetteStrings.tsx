import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

interface MarionetteStringsProps {
  puppetRef: React.RefObject<THREE.Group>
  controlBarRef?: React.RefObject<THREE.Group>
  stringControls?: {
    head?: number
    leftHand?: number
    rightHand?: number
    torso?: number
    leftFoot?: number
    rightFoot?: number
  }
  puppetPosition?: [number, number, number]
  onStringPull?: (stringName: string, pullAmount: number) => void
}

export default function MarionetteStrings({ 
  puppetRef, 
  controlBarRef,
  stringControls = {},
  puppetPosition = [0, 1, 0],
  onStringPull
}: MarionetteStringsProps) {
  const stringsRef = useRef<THREE.Group>(null)
  const [stringLines, setStringLines] = useState<JSX.Element[]>([])
  const [draggedString, setDraggedString] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<THREE.Vector3 | null>(null)
  const { gl } = useThree()

  useFrame(() => {
    if (!puppetRef.current) {
      if (stringLines.length > 0) setStringLines([])
      return
    }
    
    // Get control bar world position (updates every frame)
    const controlBarWorldPos = new THREE.Vector3()
    const controlBarWorldQuat = new THREE.Quaternion()
    const controlBarWorldScale = new THREE.Vector3()
    
    if (controlBarRef?.current) {
      controlBarRef.current.getWorldPosition(controlBarWorldPos)
      controlBarRef.current.getWorldQuaternion(controlBarWorldQuat)
      controlBarRef.current.getWorldScale(controlBarWorldScale)
    } else {
      // Default position above puppet if no control bar
      controlBarWorldPos.set(puppetPosition[0], puppetPosition[1] + 1.5, puppetPosition[2])
    }

    // Get puppet world position
    const puppetWorldPos = new THREE.Vector3()
    const puppetWorldQuat = new THREE.Quaternion()
    if (puppetRef.current) {
      puppetRef.current.getWorldPosition(puppetWorldPos)
      puppetRef.current.getWorldQuaternion(puppetWorldQuat)
    } else {
      puppetWorldPos.set(...puppetPosition)
    }

    // Puppet attachment points (based on actual puppet geometry)
    // Head top
    const puppetHeadLocal = new THREE.Vector3(0, 0.4 + 0.15, 0) // Head is at y=0.4, radius=0.15
    // Chest (torso top)
    const puppetChestLocal = new THREE.Vector3(0, 0.2, 0) // Torso center is at y=0, height=0.4, so top is y=0.2
    // Left hand (shoulder at -0.15, upper arm extends to -0.18, forearm to -0.36, hand at -0.36)
    const puppetLeftHandLocal = new THREE.Vector3(-0.36, 0.1, 0) // Hand is at end of forearm
    // Right hand
    const puppetRightHandLocal = new THREE.Vector3(0.36, 0.1, 0)
    // Left shoulder (where arm attaches to torso)
    const puppetLeftShoulderLocal = new THREE.Vector3(-0.15, 0.1, 0)
    // Right shoulder
    const puppetRightShoulderLocal = new THREE.Vector3(0.15, 0.1, 0)
    // Left foot (hip at -0.1, -0.2, thigh extends down 0.2, shin extends down 0.2, foot at end)
    const puppetLeftFootLocal = new THREE.Vector3(-0.1, -0.2 - 0.2 - 0.2, 0.05) // Hip at y=-0.2, thigh 0.2, shin 0.2, foot at end
    // Right foot
    const puppetRightFootLocal = new THREE.Vector3(0.1, -0.2 - 0.2 - 0.2, 0.05)

    // Transform to world space
    const puppetHeadPos = puppetHeadLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetChestPos = puppetChestLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftHandPos = puppetLeftHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightHandPos = puppetRightHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftShoulderPos = puppetLeftShoulderLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightShoulderPos = puppetRightShoulderLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftFootPos = puppetLeftFootLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightFootPos = puppetRightFootLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)

    // Control bar attachment points (matching smaller crossbar)
    // h_center for head and chest - on the stem below crossbar
    const controlCenterLocal = new THREE.Vector3(0, 0, -0.20)
    // h_left for left hand - left end of crossbar (now smaller: -0.12)
    const controlLeftLocal = new THREE.Vector3(-0.12, 0, 0)
    // h_right for right hand - right end of crossbar (now smaller: 0.12)
    const controlRightLocal = new THREE.Vector3(0.12, 0, 0)
    // h_front for left shoulder and left foot - front of crossbar (+Y)
    const controlFrontLocal = new THREE.Vector3(0, 0.06, 0)
    // h_back for right shoulder and right foot - back of crossbar (-Y)
    const controlBackLocal = new THREE.Vector3(0, -0.06, 0)

    // Transform to world space
    const controlCenterPos = controlCenterLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlLeftPos = controlLeftLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlRightPos = controlRightLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlFrontPos = controlFrontLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlBackPos = controlBackLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)

    // Apply string control (pull strings up when control > 0)
    const pullAmount = 0.3
    const headPull = (stringControls.head || 0) * pullAmount
    const chestPull = (stringControls.torso || 0) * pullAmount
    const leftHandPull = (stringControls.leftHand || 0) * pullAmount
    const rightHandPull = (stringControls.rightHand || 0) * pullAmount
    const leftShoulderPull = (stringControls.torso || 0) * pullAmount * 0.5 // Shoulder strings use torso control
    const rightShoulderPull = (stringControls.torso || 0) * pullAmount * 0.5
    const leftFootPull = (stringControls.leftFoot || 0) * pullAmount
    const rightFootPull = (stringControls.rightFoot || 0) * pullAmount

    // All 8 strings from MuJoCo model
    const stringConfigs = [
      {
        name: 'head',
        start: puppetHeadPos,
        end: controlCenterPos.clone().add(new THREE.Vector3(0, -headPull, 0)),
        color: '#ff6b6b',
        visible: true,
      },
      {
        name: 'chest',
        start: puppetChestPos,
        end: controlCenterPos.clone().add(new THREE.Vector3(0, -chestPull, 0)),
        color: '#ff8c8c',
        visible: true,
      },
      {
        name: 'leftHand',
        start: puppetLeftHandPos,
        end: controlLeftPos.clone().add(new THREE.Vector3(0, -leftHandPull, 0)),
        color: '#4ecdc4',
        visible: true,
      },
      {
        name: 'rightHand',
        start: puppetRightHandPos,
        end: controlRightPos.clone().add(new THREE.Vector3(0, -rightHandPull, 0)),
        color: '#45b7d1',
        visible: true,
      },
      {
        name: 'leftShoulder',
        start: puppetLeftShoulderPos,
        end: controlFrontPos.clone().add(new THREE.Vector3(0, -leftShoulderPull, 0)),
        color: '#96ceb4',
        visible: true,
      },
      {
        name: 'rightShoulder',
        start: puppetRightShoulderPos,
        end: controlBackPos.clone().add(new THREE.Vector3(0, -rightShoulderPull, 0)),
        color: '#a8d5ba',
        visible: true,
      },
      {
        name: 'leftFoot',
        start: puppetLeftFootPos,
        end: controlFrontPos.clone().add(new THREE.Vector3(0, -leftFootPull, 0)),
        color: '#ffeaa7',
        visible: true,
      },
      {
        name: 'rightFoot',
        start: puppetRightFootPos,
        end: controlBackPos.clone().add(new THREE.Vector3(0, -rightFootPull, 0)),
        color: '#fdcb6e',
        visible: true,
      },
    ]

    // Handle string dragging
    const handleStringDown = (e: any, stringName: string) => {
      // Don't drag if Option/Cmd is held (let camera controls work)
      if (e.altKey || e.metaKey) {
        return
      }
      
      e.stopPropagation()
      e.nativeEvent?.stopPropagation()
      setDraggedString(stringName)
      setDragStartPos(e.point.clone())
      gl.domElement.style.cursor = 'grabbing'
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const handleStringMove = (e: any) => {
      if (!draggedString || !dragStartPos) return
      // Don't drag if Option/Cmd is held (let camera controls work)
      if (e.altKey || e.metaKey) {
        setDraggedString(null)
        setDragStartPos(null)
        return
      }
      e.stopPropagation()
      e.nativeEvent?.stopPropagation()
      
      // Calculate pull amount based on vertical movement (pulling up = more pull)
      const dragDelta = e.point.clone().sub(dragStartPos)
      const pullAmount = Math.max(0, Math.min(1, -dragDelta.y / 0.5)) // Pull up to 0.5m = full pull
      
      if (onStringPull) {
        onStringPull(draggedString, pullAmount)
      }
    }

    const handleStringUp = (e: any) => {
      if (draggedString) {
        setDraggedString(null)
        setDragStartPos(null)
        gl.domElement.style.cursor = 'grab'
        if (e.target) {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId)
        }
      }
    }

    const lines = stringConfigs
      .filter(config => config.visible !== false)
      .map((config) => {
        // Create flexible curved string using quadratic bezier curve
        // Control point creates the sag/curve in the string
        const midPoint = new THREE.Vector3()
          .addVectors(config.start, config.end)
          .multiplyScalar(0.5)
        
        // Add sag based on string length (longer strings sag more)
        const stringLength = config.start.distanceTo(config.end)
        const sagAmount = Math.max(0.02, stringLength * 0.08) // 8% sag, minimum 2cm
        
        // Sag downward (negative Y) to simulate gravity
        const controlPoint = midPoint.clone()
        controlPoint.y -= sagAmount
        
        // Create curve with multiple points for smooth flexible appearance
        const curve = new THREE.QuadraticBezierCurve3(
          config.start,
          controlPoint,
          config.end
        )
        
        // Generate points along the curve
        const curvePoints = curve.getPoints(30)
        
        // Create interactive hitboxes at key points along the string
        const hitboxPoints = [
          curvePoints[Math.floor(curvePoints.length * 0.25)],
          curvePoints[Math.floor(curvePoints.length * 0.5)],
          curvePoints[Math.floor(curvePoints.length * 0.75)],
        ]
        
        return (
          <group key={config.name}>
            <Line
              points={curvePoints}
              color={config.color}
              lineWidth={draggedString === config.name ? 2.5 : 1.5}
              transparent
              opacity={draggedString === config.name ? 1.0 : 0.7}
            />
            {/* Interactive hitboxes along the string - spheres for easier interaction */}
            {hitboxPoints.map((point, idx) => (
              <mesh
                key={`${config.name}-hitbox-${idx}`}
                position={[point.x, point.y, point.z]}
                onPointerDown={(e) => handleStringDown(e, config.name)}
                onPointerMove={handleStringMove}
                onPointerUp={handleStringUp}
                onPointerLeave={handleStringUp}
                visible={false}
              >
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial transparent opacity={0} />
              </mesh>
            ))}
          </group>
        )
      })
    
    setStringLines(lines)
  })

  return <group ref={stringsRef}>{stringLines}</group>
}
