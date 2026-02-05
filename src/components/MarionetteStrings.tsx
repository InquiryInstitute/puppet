import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

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
  onPositionsChange?: (positions: {
    controller: StringPositions
    stringStart: StringPositions
    stringEnd: StringPositions
    puppet: StringPositions
  }) => void
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
  onPositionsChange,
  headRef,
  leftForearmRef,
  rightForearmRef,
  leftShinRef,
  rightShinRef
}: MarionetteStringsProps) {
  const stringsRef = useRef<THREE.Group>(null)
  const [stringLines, setStringLines] = useState<JSX.Element[]>([])
  const [debugSpheres, setDebugSpheres] = useState<JSX.Element[]>([])
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
    
    // Get control bar world matrix (updates every frame)
    const controlBarWorldMatrix = new THREE.Matrix4()
    
    if (controlBarRef?.current) {
      // Update world matrix to ensure it's current
      controlBarRef.current.updateWorldMatrix(true, false)
      controlBarWorldMatrix.copy(controlBarRef.current.matrixWorld)
    } else {
      // Default position above puppet if no control bar
      controlBarWorldMatrix.identity()
      controlBarWorldMatrix.setPosition(puppetPosition[0], puppetPosition[1] + 1.5, puppetPosition[2])
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

    // Transform to world space using the control bar's world matrix (same as how child meshes are transformed)
    const controlCenterPos = new THREE.Vector3().copy(controlCenterLocal).applyMatrix4(controlBarWorldMatrix)
    const controlLeftPos = new THREE.Vector3().copy(controlLeftLocal).applyMatrix4(controlBarWorldMatrix)
    const controlRightPos = new THREE.Vector3().copy(controlRightLocal).applyMatrix4(controlBarWorldMatrix)
    const controlFrontPos = new THREE.Vector3().copy(controlFrontLocal).applyMatrix4(controlBarWorldMatrix)
    const controlBackPos = new THREE.Vector3().copy(controlBackLocal).applyMatrix4(controlBarWorldMatrix)
    
    // Store positions for debug spheres to use
    controlBarPositionsRef.current = {
      center: controlCenterPos.clone(),
      left: controlLeftPos.clone(),
      right: controlRightPos.clone(),
      front: controlFrontPos.clone(),
      back: controlBackPos.clone(),
    }

    // Line is rendered inside the puppet group, so points must be in puppet local space.
    // Convert world-space positions to puppet local so strings attach correctly.
    if (!puppetRef.current) return
    puppetRef.current.updateWorldMatrix(true, false)
    const puppetWorldInverse = new THREE.Matrix4().copy(puppetRef.current.matrixWorld).invert()
    const toPuppetLocal = (v: THREE.Vector3) => v.clone().applyMatrix4(puppetWorldInverse)

    // All 8 strings from MuJoCo model - connect directly to control bar attachment points
    // Use puppet-local positions so Line (child of puppet group) draws correctly
    const stringConfigs = [
      {
        name: 'head',
        start: toPuppetLocal(puppetHeadPos),
        end: toPuppetLocal(controlCenterPos),
        color: '#ff6b6b',
        visible: true,
      },
      {
        name: 'chest',
        start: toPuppetLocal(puppetChestPos),
        end: toPuppetLocal(controlCenterPos),
        color: '#ff8c8c',
        visible: true,
      },
      {
        name: 'leftHand',
        start: toPuppetLocal(puppetLeftHandPos),
        end: toPuppetLocal(controlLeftPos),
        color: '#4ecdc4',
        visible: true,
      },
      {
        name: 'rightHand',
        start: toPuppetLocal(puppetRightHandPos),
        end: toPuppetLocal(controlRightPos),
        color: '#45b7d1',
        visible: true,
      },
      {
        name: 'leftShoulder',
        start: toPuppetLocal(puppetLeftShoulderPos),
        end: toPuppetLocal(controlFrontPos),
        color: '#96ceb4',
        visible: true,
      },
      {
        name: 'rightShoulder',
        start: toPuppetLocal(puppetRightShoulderPos),
        end: toPuppetLocal(controlBackPos),
        color: '#a8d5ba',
        visible: true,
      },
      {
        name: 'leftFoot',
        start: toPuppetLocal(puppetLeftFootPos),
        end: toPuppetLocal(controlFrontPos),
        color: '#ffeaa7',
        visible: true,
      },
      {
        name: 'rightFoot',
        start: toPuppetLocal(puppetRightFootPos),
        end: toPuppetLocal(controlBackPos),
        color: '#fdcb6e',
        visible: true,
      },
    ]
    
    // Report positions to parent component for display
    if (onPositionsChange) {
      onPositionsChange({
        controller: {
          head: { x: controlCenterPos.x, y: controlCenterPos.y, z: controlCenterPos.z },
          chest: { x: controlCenterPos.x, y: controlCenterPos.y, z: controlCenterPos.z },
          leftHand: { x: controlLeftPos.x, y: controlLeftPos.y, z: controlLeftPos.z },
          rightHand: { x: controlRightPos.x, y: controlRightPos.y, z: controlRightPos.z },
          leftShoulder: { x: controlFrontPos.x, y: controlFrontPos.y, z: controlFrontPos.z },
          rightShoulder: { x: controlBackPos.x, y: controlBackPos.y, z: controlBackPos.z },
          leftFoot: { x: controlFrontPos.x, y: controlFrontPos.y, z: controlFrontPos.z },
          rightFoot: { x: controlBackPos.x, y: controlBackPos.y, z: controlBackPos.z },
        },
        stringStart: {
          head: { x: puppetHeadPos.x, y: puppetHeadPos.y, z: puppetHeadPos.z },
          chest: { x: puppetChestPos.x, y: puppetChestPos.y, z: puppetChestPos.z },
          leftHand: { x: puppetLeftHandPos.x, y: puppetLeftHandPos.y, z: puppetLeftHandPos.z },
          rightHand: { x: puppetRightHandPos.x, y: puppetRightHandPos.y, z: puppetRightHandPos.z },
          leftShoulder: { x: puppetLeftShoulderPos.x, y: puppetLeftShoulderPos.y, z: puppetLeftShoulderPos.z },
          rightShoulder: { x: puppetRightShoulderPos.x, y: puppetRightShoulderPos.y, z: puppetRightShoulderPos.z },
          leftFoot: { x: puppetLeftFootPos.x, y: puppetLeftFootPos.y, z: puppetLeftFootPos.z },
          rightFoot: { x: puppetRightFootPos.x, y: puppetRightFootPos.y, z: puppetRightFootPos.z },
        },
        stringEnd: {
          head: { x: controlCenterPos.x, y: controlCenterPos.y, z: controlCenterPos.z },
          chest: { x: controlCenterPos.x, y: controlCenterPos.y, z: controlCenterPos.z },
          leftHand: { x: controlLeftPos.x, y: controlLeftPos.y, z: controlLeftPos.z },
          rightHand: { x: controlRightPos.x, y: controlRightPos.y, z: controlRightPos.z },
          leftShoulder: { x: controlFrontPos.x, y: controlFrontPos.y, z: controlFrontPos.z },
          rightShoulder: { x: controlBackPos.x, y: controlBackPos.y, z: controlBackPos.z },
          leftFoot: { x: controlFrontPos.x, y: controlFrontPos.y, z: controlFrontPos.z },
          rightFoot: { x: controlBackPos.x, y: controlBackPos.y, z: controlBackPos.z },
        },
        puppet: {
          head: { x: puppetHeadPos.x, y: puppetHeadPos.y, z: puppetHeadPos.z },
          chest: { x: puppetChestPos.x, y: puppetChestPos.y, z: puppetChestPos.z },
          leftHand: { x: puppetLeftHandPos.x, y: puppetLeftHandPos.y, z: puppetLeftHandPos.z },
          rightHand: { x: puppetRightHandPos.x, y: puppetRightHandPos.y, z: puppetRightHandPos.z },
          leftShoulder: { x: puppetLeftShoulderPos.x, y: puppetLeftShoulderPos.y, z: puppetLeftShoulderPos.z },
          rightShoulder: { x: puppetRightShoulderPos.x, y: puppetRightShoulderPos.y, z: puppetRightShoulderPos.z },
          leftFoot: { x: puppetLeftFootPos.x, y: puppetLeftFootPos.y, z: puppetLeftFootPos.z },
          rightFoot: { x: puppetRightFootPos.x, y: puppetRightFootPos.y, z: puppetRightFootPos.z },
        },
      })
    }

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
        
        const stringLength = config.start.distanceTo(config.end)
        // When control bar is below puppet attachment (end.y < start.y), string is slack → heavy sag
        const isSlack = config.end.y < config.start.y
        const sagAmount = isSlack
          ? Math.max(0.15, stringLength * 0.4) // 40% of length or 15cm min for loose hanging
          : Math.max(0.01, stringLength * 0.03) // 3% when taut
        
        const controlPoint = midPoint.clone()
        controlPoint.y -= sagAmount
        
        // Create curve with multiple points for smooth flexible appearance
        // Ensure curve starts and ends exactly at attachment points
        const curve = new THREE.QuadraticBezierCurve3(
          config.start.clone(), // Explicit clone to ensure exact position
          controlPoint,
          config.end.clone() // Explicit clone to ensure exact position
        )
        
        // Generate points along the curve, ensuring first and last points are exact
        const curvePoints = curve.getPoints(30)
        // Ensure first point is exactly at start
        curvePoints[0].copy(config.start)
        // Ensure last point is exactly at end
        curvePoints[curvePoints.length - 1].copy(config.end)
        
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
            {/* Debug: Show exact start point of string - use the same position as the string itself */}
            <mesh position={[config.start.x, config.start.y, config.start.z]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.0} />
            </mesh>
            {/* Debug: Show exact end point of string - use the same position as the string itself */}
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
    
    // Debug spheres in puppet local space (same as string lines)
    const spheres: JSX.Element[] = []
    const cCenter = toPuppetLocal(controlCenterPos)
    const cLeft = toPuppetLocal(controlLeftPos)
    const cRight = toPuppetLocal(controlRightPos)
    const cFront = toPuppetLocal(controlFrontPos)
    const cBack = toPuppetLocal(controlBackPos)
    const pHead = toPuppetLocal(puppetHeadPos)
    const pChest = toPuppetLocal(puppetChestPos)
    const pLeftHand = toPuppetLocal(puppetLeftHandPos)
    const pRightHand = toPuppetLocal(puppetRightHandPos)
    const pLeftShoulder = toPuppetLocal(puppetLeftShoulderPos)
    const pRightShoulder = toPuppetLocal(puppetRightShoulderPos)
    const pLeftFoot = toPuppetLocal(puppetLeftFootPos)
    const pRightFoot = toPuppetLocal(puppetRightFootPos)
    
    spheres.push(<mesh key="control-center" position={[cCenter.x, cCenter.y, cCenter.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="control-left" position={[cLeft.x, cLeft.y, cLeft.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="control-right" position={[cRight.x, cRight.y, cRight.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="magenta" emissive="magenta" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="control-front" position={[cFront.x, cFront.y, cFront.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="lime" emissive="lime" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="control-back" position={[cBack.x, cBack.y, cBack.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-head" position={[pHead.x, pHead.y, pHead.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-chest" position={[pChest.x, pChest.y, pChest.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="pink" emissive="pink" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-leftHand" position={[pLeftHand.x, pLeftHand.y, pLeftHand.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-rightHand" position={[pRightHand.x, pRightHand.y, pRightHand.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="green" emissive="green" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-leftShoulder" position={[pLeftShoulder.x, pLeftShoulder.y, pLeftShoulder.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="cyan" emissive="cyan" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-rightShoulder" position={[pRightShoulder.x, pRightShoulder.y, pRightShoulder.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="magenta" emissive="magenta" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-leftFoot" position={[pLeftFoot.x, pLeftFoot.y, pLeftFoot.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={0.5} /></mesh>)
    spheres.push(<mesh key="puppet-rightFoot" position={[pRightFoot.x, pRightFoot.y, pRightFoot.z]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={0.5} /></mesh>)
    
    setDebugSpheres(spheres)
  })

  return (
    <group ref={stringsRef}>
      {stringLines}
      {debugSpheres}
    </group>
  )
}
