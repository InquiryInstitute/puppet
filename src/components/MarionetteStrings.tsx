import { useMemo, useRef } from 'react'
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
}

export default function MarionetteStrings({ 
  puppetRef, 
  controlBarRef,
  stringControls = {},
  puppetPosition = [0, 1, 0]
}: MarionetteStringsProps) {
  const stringsRef = useRef<THREE.Group>(null)

  const strings = useMemo(() => {
    if (!puppetRef.current) return null

    const controlBarWorldPos = new THREE.Vector3()
    const controlBarWorldQuat = new THREE.Quaternion()
    
    if (controlBarRef?.current) {
      controlBarRef.current.getWorldPosition(controlBarWorldPos)
      controlBarRef.current.getWorldQuaternion(controlBarWorldQuat)
    } else {
      controlBarWorldPos.set(puppetPosition[0], puppetPosition[1] + 0.5, puppetPosition[2])
    }

    const puppetWorldPos = new THREE.Vector3()
    const puppetWorldQuat = new THREE.Quaternion()
    if (puppetRef.current) {
      puppetRef.current.getWorldPosition(puppetWorldPos)
      puppetRef.current.getWorldQuaternion(puppetWorldQuat)
    } else {
      puppetWorldPos.set(...puppetPosition)
    }

    const puppetHeadLocal = new THREE.Vector3(0, 0.42, 0)
    const puppetLeftHandLocal = new THREE.Vector3(-0.2, -0.19, 0)
    const puppetRightHandLocal = new THREE.Vector3(0.2, -0.19, 0)

    const puppetHeadPos = puppetHeadLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetLeftHandPos = puppetLeftHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)
    const puppetRightHandPos = puppetRightHandLocal.clone().applyQuaternion(puppetWorldQuat).add(puppetWorldPos)

    const controlHeadLocal = new THREE.Vector3(0, 0, 0)
    const controlLeftHandLocal = new THREE.Vector3(-0.15, 0, 0)
    const controlRightHandLocal = new THREE.Vector3(0.15, 0, 0)

    const controlHeadPos = controlHeadLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlLeftHandPos = controlLeftHandLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)
    const controlRightHandPos = controlRightHandLocal.clone().applyQuaternion(controlBarWorldQuat).add(controlBarWorldPos)

    const pullAmount = 0.3
    const headPull = (stringControls.head || 0) * pullAmount
    const leftHandPull = (stringControls.leftHand || 0) * pullAmount
    const rightHandPull = (stringControls.rightHand || 0) * pullAmount

    const stringConfigs = [
      {
        name: 'head',
        start: puppetHeadPos,
        end: controlHeadPos.clone().add(new THREE.Vector3(0, -headPull, 0)),
        color: '#ff6b6b',
      },
      {
        name: 'leftHand',
        start: puppetLeftHandPos,
        end: controlLeftHandPos.clone().add(new THREE.Vector3(0, -leftHandPull, 0)),
        color: '#4ecdc4',
      },
      {
        name: 'rightHand',
        start: puppetRightHandPos,
        end: controlRightHandPos.clone().add(new THREE.Vector3(0, -rightHandPull, 0)),
        color: '#45b7d1',
      },
    ]

    return stringConfigs.map((config) => {
      const points = [config.start, config.end]
      return (
        <Line
          key={config.name}
          points={points}
          color={config.color}
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      )
    })
  }, [puppetRef, controlBarRef, stringControls, puppetPosition])

  return <group ref={stringsRef}>{strings}</group>
}
