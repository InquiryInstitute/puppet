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
  stringControls: _stringControls = {}, // Kept for interface compatibility but not used in length calculation
  puppetPosition = [0, 1, 0],
  onStringPull
}: MarionetteStringsProps) {
  const stringsRef = useRef<THREE.Group>(null)
  const [stringLines, setStringLines] = useState<JSX.Element[]>([])
  const [draggedString, setDraggedString] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<THREE.Vector3 | null>(null)
  const { gl } = useThree()
  
  // Store natural (rest) length of each string
  const naturalLengthsRef = useRef<{ [key: string]: number }>({})

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
    // All positions are relative to the puppet group (which is at [0, 0.625, 0] in world space)
    // Torso is at [0, 0, 0] relative to group, height=0.4 (so top at y=0.2, bottom at y=-0.2)
    // Head is at [0, 0.4, 0] relative to torso, radius=0.15, so top of head is at y=0.4+0.15=0.55
    const puppetHeadLocal = new THREE.Vector3(0, 0.55, 0) // Top of head sphere
    
    // Chest (torso top) - torso center at y=0, height=0.4, so top is y=0.2
    const puppetChestLocal = new THREE.Vector3(0, 0.2, 0)
    
    // Left hand: shoulder at [-0.15, 0.1, 0] relative to torso
    // Upper arm extends from shoulder to [-0.15-0.18, 0.1, 0] = [-0.33, 0.1, 0]
    // Forearm group is at [-0.18, 0, 0] relative to upper arm, so [-0.33, 0.1, 0] relative to group
    // Forearm extends another 0.18, hand sphere is at [-0.18, 0, 0] relative to forearm group
    // So hand is at [-0.33-0.18, 0.1, 0] = [-0.51, 0.1, 0] relative to group
    const puppetLeftHandLocal = new THREE.Vector3(-0.51, 0.1, 0)
    
    // Right hand: mirror of left
    const puppetRightHandLocal = new THREE.Vector3(0.51, 0.1, 0)
    
    // Left shoulder: where arm attaches to torso
    const puppetLeftShoulderLocal = new THREE.Vector3(-0.15, 0.1, 0)
    
    // Right shoulder
    const puppetRightShoulderLocal = new THREE.Vector3(0.15, 0.1, 0)
    
    // Left foot: hip at [-0.1, -0.2, 0] relative to torso
    // Thigh extends down 0.2, so thigh end is at [-0.1, -0.2-0.2, 0] = [-0.1, -0.4, 0]
    // Shin group is at [0, -0.2, 0] relative to thigh, so [-0.1, -0.4-0.2, 0] = [-0.1, -0.6, 0]
    // Shin extends down 0.2, foot is at [0, -0.2, 0.05] relative to shin
    // So foot is at [-0.1, -0.6-0.2, 0.05] = [-0.1, -0.8, 0.05] relative to group
    const puppetLeftFootLocal = new THREE.Vector3(-0.1, -0.8, 0.05)
    
    // Right foot: mirror of left
    const puppetRightFootLocal = new THREE.Vector3(0.1, -0.8, 0.05)

    // Transform to world space
    // Note: puppetWorldPos is the center of the puppet group (at [0, 0.625, 0] in world)
    // All local positions are relative to this group center
    const puppetHeadPos = puppetHeadLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetChestPos = puppetChestLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftHandPos = puppetLeftHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightHandPos = puppetRightHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftShoulderPos = puppetLeftShoulderLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightShoulderPos = puppetRightShoulderLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftFootPos = puppetLeftFootLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightFootPos = puppetRightFootLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)

    // Control bar attachment points (matching smaller crossbar)
    // Coordinate system: X=left/right, Y=up/down, Z=forward/back
    // h_center for head and chest - on the stem below crossbar
    const controlCenterLocal = new THREE.Vector3(0, 0, -0.20)
    // h_left for left hand - left end of crossbar (now smaller: -0.12)
    const controlLeftLocal = new THREE.Vector3(-0.12, 0, 0)
    // h_right for right hand - right end of crossbar (now smaller: 0.12)
    const controlRightLocal = new THREE.Vector3(0.12, 0, 0)
    // h_front for left shoulder and left foot - front of crossbar (+Z, toward camera)
    const controlFrontLocal = new THREE.Vector3(0, 0, 0.06)
    // h_back for right shoulder and right foot - back of crossbar (-Z, away from camera)
    const controlBackLocal = new THREE.Vector3(0, 0, -0.06)

    // Transform to world space
    const controlCenterPos = controlCenterLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlLeftPos = controlLeftLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlRightPos = controlRightLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlFrontPos = controlFrontLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlBackPos = controlBackLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)

    // Calculate natural (rest) length for each string on first frame
    // Natural length is the distance when puppet is at rest and control bar is at default position
    const calculateNaturalLength = (start: THREE.Vector3, end: THREE.Vector3, name: string) => {
      if (!naturalLengthsRef.current[name]) {
        naturalLengthsRef.current[name] = start.distanceTo(end)
      }
      return naturalLengthsRef.current[name]
    }

    // All 8 strings from MuJoCo model - calculate end points without stretching
    const stringConfigs = [
      {
        name: 'head',
        start: puppetHeadPos,
        controlEnd: controlCenterPos,
        color: '#ff6b6b',
        visible: true,
      },
      {
        name: 'chest',
        start: puppetChestPos,
        controlEnd: controlCenterPos,
        color: '#ff8c8c',
        visible: true,
      },
      {
        name: 'leftHand',
        start: puppetLeftHandPos,
        controlEnd: controlLeftPos,
        color: '#4ecdc4',
        visible: true,
      },
      {
        name: 'rightHand',
        start: puppetRightHandPos,
        controlEnd: controlRightPos,
        color: '#45b7d1',
        visible: true,
      },
      {
        name: 'leftShoulder',
        start: puppetLeftShoulderPos,
        controlEnd: controlFrontPos,
        color: '#96ceb4',
        visible: true,
      },
      {
        name: 'rightShoulder',
        start: puppetRightShoulderPos,
        controlEnd: controlBackPos,
        color: '#a8d5ba',
        visible: true,
      },
      {
        name: 'leftFoot',
        start: puppetLeftFootPos,
        controlEnd: controlFrontPos,
        color: '#ffeaa7',
        visible: true,
      },
      {
        name: 'rightFoot',
        start: puppetRightFootPos,
        controlEnd: controlBackPos,
        color: '#fdcb6e',
        visible: true,
      },
    ].map(config => {
      // Calculate natural length
      const naturalLength = calculateNaturalLength(config.start, config.controlEnd, config.name)
      
      // Calculate current distance
      const currentDistance = config.start.distanceTo(config.controlEnd)
      
      // If string would stretch beyond natural length, constrain the end point
      let end: THREE.Vector3
      if (currentDistance > naturalLength) {
        // String is being pulled - constrain to natural length
        const direction = new THREE.Vector3().subVectors(config.controlEnd, config.start).normalize()
        end = config.start.clone().add(direction.multiplyScalar(naturalLength))
      } else {
        // String is slack - use actual control bar position (string can be shorter but not longer)
        end = config.controlEnd.clone()
      }
      
      return {
        ...config,
        end,
        naturalLength,
        currentDistance,
        isTaut: currentDistance >= naturalLength
      }
    })

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
        // Only sag if string is slack (not taut)
        const stringLength = config.start.distanceTo(config.end)
        const sagAmount = config.isTaut 
          ? 0 // No sag when taut
          : Math.max(0.02, stringLength * 0.08) // 8% sag when slack, minimum 2cm
        
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
              lineWidth={draggedString === config.name ? 2.5 : (config.isTaut ? 2.0 : 1.5)}
              transparent
              opacity={draggedString === config.name ? 1.0 : (config.isTaut ? 0.9 : 0.7)}
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
