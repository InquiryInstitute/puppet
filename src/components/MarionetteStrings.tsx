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
  // Optional refs to actual body parts for precise attachment points
  headRef?: React.RefObject<THREE.Group>
  leftForearmRef?: React.RefObject<THREE.Group>
  rightForearmRef?: React.RefObject<THREE.Group>
  leftShinRef?: React.RefObject<THREE.Group>
  rightShinRef?: React.RefObject<THREE.Group>
}

export default function MarionetteStrings({ 
  puppetRef, 
  controlBarRef,
  stringControls: _stringControls = {}, // Kept for interface compatibility but not used in length calculation
  puppetPosition = [0, 1, 0],
  onStringPull,
  headRef,
  leftForearmRef,
  rightForearmRef,
  leftShinRef,
  rightShinRef
}: MarionetteStringsProps) {
  const stringsRef = useRef<THREE.Group>(null)
  const [stringLines, setStringLines] = useState<JSX.Element[]>([])
  const [draggedString, setDraggedString] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<THREE.Vector3 | null>(null)
  const { gl } = useThree()
  
  // Store control bar positions to share with debug spheres
  const controlBarPositionsRef = useRef<{
    center?: THREE.Vector3
    left?: THREE.Vector3
    right?: THREE.Vector3
    front?: THREE.Vector3
    back?: THREE.Vector3
  }>({})
  
  // Store puppet attachment positions to share with debug spheres
  const puppetPositionsRef = useRef<{
    head?: THREE.Vector3
    chest?: THREE.Vector3
    leftHand?: THREE.Vector3
    rightHand?: THREE.Vector3
    leftShoulder?: THREE.Vector3
    rightShoulder?: THREE.Vector3
    leftFoot?: THREE.Vector3
    rightFoot?: THREE.Vector3
  }>({})

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

    // Get puppet attachment points - use refs if available for precise positions, otherwise calculate
    const getWorldPositionFromRef = (ref: React.RefObject<THREE.Group> | undefined, offset: THREE.Vector3): THREE.Vector3 => {
      if (ref?.current) {
        const worldPos = new THREE.Vector3()
        ref.current.getWorldPosition(worldPos)
        // Apply offset in local space, then transform to world
        const localOffset = offset.clone().applyQuaternion(ref.current.getWorldQuaternion(new THREE.Quaternion()))
        return worldPos.add(localOffset)
      }
      // Fallback: calculate from puppet group
      const localPos = offset.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
      return localPos
    }
    
    // Head: top of head sphere (head is at [0, 0.4, 0] relative to torso, sphere radius 0.15)
    const puppetHeadPos = headRef 
      ? getWorldPositionFromRef(headRef, new THREE.Vector3(0, 0.15, 0)) // Top of sphere
      : new THREE.Vector3(0, 0.55, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Chest: top of torso (torso center at y=0, height=0.4, so top at y=0.2)
    const puppetChestPos = new THREE.Vector3(0, 0.2, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Left hand: end of forearm (hand sphere at [-0.18, 0, 0] relative to forearm group)
    const puppetLeftHandPos = leftForearmRef
      ? getWorldPositionFromRef(leftForearmRef, new THREE.Vector3(-0.18, 0, 0)) // Hand sphere position
      : new THREE.Vector3(-0.51, 0.1, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Right hand: mirror of left
    const puppetRightHandPos = rightForearmRef
      ? getWorldPositionFromRef(rightForearmRef, new THREE.Vector3(0.18, 0, 0)) // Hand sphere position
      : new THREE.Vector3(0.51, 0.1, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Left shoulder: where arm attaches to torso
    const puppetLeftShoulderPos = new THREE.Vector3(-0.15, 0.1, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Right shoulder
    const puppetRightShoulderPos = new THREE.Vector3(0.15, 0.1, 0).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Left foot: bottom of foot (foot is at [0, -0.2, 0.05] relative to shin)
    const puppetLeftFootPos = leftShinRef
      ? getWorldPositionFromRef(leftShinRef, new THREE.Vector3(0, -0.2, 0.05)) // Foot position
      : new THREE.Vector3(-0.1, -0.8, 0.05).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Right foot: mirror of left
    const puppetRightFootPos = rightShinRef
      ? getWorldPositionFromRef(rightShinRef, new THREE.Vector3(0, -0.2, 0.05)) // Foot position
      : new THREE.Vector3(0.1, -0.8, 0.05).clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    
    // Store puppet positions for debug spheres to use
    puppetPositionsRef.current = {
      head: puppetHeadPos.clone(),
      chest: puppetChestPos.clone(),
      leftHand: puppetLeftHandPos.clone(),
      rightHand: puppetRightHandPos.clone(),
      leftShoulder: puppetLeftShoulderPos.clone(),
      rightShoulder: puppetRightShoulderPos.clone(),
      leftFoot: puppetLeftFootPos.clone(),
      rightFoot: puppetRightFootPos.clone(),
    }

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

    // Transform to world space - create new Vector3 instances to avoid mutation
    const controlCenterPos = new THREE.Vector3().copy(controlCenterLocal).applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlLeftPos = new THREE.Vector3().copy(controlLeftLocal).applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlRightPos = new THREE.Vector3().copy(controlRightLocal).applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlFrontPos = new THREE.Vector3().copy(controlFrontLocal).applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlBackPos = new THREE.Vector3().copy(controlBackLocal).applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    
    // Store positions for debug spheres to use
    controlBarPositionsRef.current = {
      center: controlCenterPos.clone(),
      left: controlLeftPos.clone(),
      right: controlRightPos.clone(),
      front: controlFrontPos.clone(),
      back: controlBackPos.clone(),
    }

    // All 8 strings from MuJoCo model - connect directly to control bar attachment points
    // Use the exact same cloned positions as the debug spheres (from refs)
    const stringConfigs = [
      {
        name: 'head',
        start: puppetPositionsRef.current.head!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.center!.clone(), // Use exact same position as debug sphere
        color: '#ff6b6b',
        visible: true,
      },
      {
        name: 'chest',
        start: puppetPositionsRef.current.chest!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.center!.clone(), // Use exact same position as debug sphere
        color: '#ff8c8c',
        visible: true,
      },
      {
        name: 'leftHand',
        start: puppetPositionsRef.current.leftHand!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.left!.clone(), // Use exact same position as debug sphere
        color: '#4ecdc4',
        visible: true,
      },
      {
        name: 'rightHand',
        start: puppetPositionsRef.current.rightHand!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.right!.clone(), // Use exact same position as debug sphere
        color: '#45b7d1',
        visible: true,
      },
      {
        name: 'leftShoulder',
        start: puppetPositionsRef.current.leftShoulder!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.front!.clone(), // Use exact same position as debug sphere
        color: '#96ceb4',
        visible: true,
      },
      {
        name: 'rightShoulder',
        start: puppetPositionsRef.current.rightShoulder!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.back!.clone(), // Use exact same position as debug sphere
        color: '#a8d5ba',
        visible: true,
      },
      {
        name: 'leftFoot',
        start: puppetPositionsRef.current.leftFoot!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.front!.clone(), // Use exact same position as debug sphere
        color: '#ffeaa7',
        visible: true,
      },
      {
        name: 'rightFoot',
        start: puppetPositionsRef.current.rightFoot!.clone(), // Use exact same position as debug sphere
        end: controlBarPositionsRef.current.back!.clone(), // Use exact same position as debug sphere
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
        
        // Convert Vector3 points to [x, y, z] arrays for Line component
        const pointsArray = curvePoints.map(p => [p.x, p.y, p.z] as [number, number, number])
        
        // Create interactive hitboxes at key points along the string
        const hitboxPoints = [
          curvePoints[Math.floor(curvePoints.length * 0.25)],
          curvePoints[Math.floor(curvePoints.length * 0.5)],
          curvePoints[Math.floor(curvePoints.length * 0.75)],
        ]
        
        return (
          <group key={config.name}>
            <Line
              points={pointsArray}
              color={config.color}
              lineWidth={draggedString === config.name ? 5 : 3}
              transparent={false}
              opacity={1.0}
            />
            {/* Debug: Show exact start point of string to verify it matches puppet attachment */}
            <mesh position={[config.start.x, config.start.y, config.start.z]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.0} />
            </mesh>
            {/* Debug: Show exact end point of string to verify it matches control bar sphere */}
            <mesh position={[config.end.x, config.end.y, config.end.z]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.0} />
            </mesh>
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

  return (
    <group ref={stringsRef}>
      {stringLines}
      {/* Debug: Show attachment points as small spheres - using positions from useFrame */}
      {controlBarPositionsRef.current.center && (
        <>
          <mesh position={[controlBarPositionsRef.current.center.x, controlBarPositionsRef.current.center.y, controlBarPositionsRef.current.center.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
          </mesh>
          {controlBarPositionsRef.current.left && (
            <mesh position={[controlBarPositionsRef.current.left.x, controlBarPositionsRef.current.left.y, controlBarPositionsRef.current.left.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={0.5} />
            </mesh>
          )}
          {controlBarPositionsRef.current.right && (
            <mesh position={[controlBarPositionsRef.current.right.x, controlBarPositionsRef.current.right.y, controlBarPositionsRef.current.right.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="magenta" emissive="magenta" emissiveIntensity={0.5} />
            </mesh>
          )}
          {controlBarPositionsRef.current.front && (
            <mesh position={[controlBarPositionsRef.current.front.x, controlBarPositionsRef.current.front.y, controlBarPositionsRef.current.front.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="lime" emissive="lime" emissiveIntensity={0.5} />
            </mesh>
          )}
          {controlBarPositionsRef.current.back && (
            <mesh position={[controlBarPositionsRef.current.back.x, controlBarPositionsRef.current.back.y, controlBarPositionsRef.current.back.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={0.5} />
            </mesh>
          )}
        </>
      )}
      {/* Debug: Show puppet attachment points - using positions from useFrame */}
      {puppetPositionsRef.current.head && (
        <>
          <mesh position={[puppetPositionsRef.current.head.x, puppetPositionsRef.current.head.y, puppetPositionsRef.current.head.z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
          </mesh>
          {puppetPositionsRef.current.chest && (
            <mesh position={[puppetPositionsRef.current.chest.x, puppetPositionsRef.current.chest.y, puppetPositionsRef.current.chest.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="pink" emissive="pink" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.leftHand && (
            <mesh position={[puppetPositionsRef.current.leftHand.x, puppetPositionsRef.current.leftHand.y, puppetPositionsRef.current.leftHand.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.rightHand && (
            <mesh position={[puppetPositionsRef.current.rightHand.x, puppetPositionsRef.current.rightHand.y, puppetPositionsRef.current.rightHand.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="green" emissive="green" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.leftShoulder && (
            <mesh position={[puppetPositionsRef.current.leftShoulder.x, puppetPositionsRef.current.leftShoulder.y, puppetPositionsRef.current.leftShoulder.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.rightShoulder && (
            <mesh position={[puppetPositionsRef.current.rightShoulder.x, puppetPositionsRef.current.rightShoulder.y, puppetPositionsRef.current.rightShoulder.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="magenta" emissive="magenta" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.leftFoot && (
            <mesh position={[puppetPositionsRef.current.leftFoot.x, puppetPositionsRef.current.leftFoot.y, puppetPositionsRef.current.leftFoot.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} />
            </mesh>
          )}
          {puppetPositionsRef.current.rightFoot && (
            <mesh position={[puppetPositionsRef.current.rightFoot.x, puppetPositionsRef.current.rightFoot.y, puppetPositionsRef.current.rightFoot.z]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={0.5} />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}
