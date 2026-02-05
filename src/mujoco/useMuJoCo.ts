import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

// MuJoCo uses Z-up: X=right, Y=forward, Z=up. Three.js uses Y-up: X=right, Y=up, Z=forward (out of screen).
function threeToMujocoPos(threePos: THREE.Vector3): [number, number, number] {
  return [threePos.x, -threePos.z, threePos.y]
}

function mujocoToThreePos(mujocoX: number, mujocoY: number, mujocoZ: number): THREE.Vector3 {
  return new THREE.Vector3(mujocoX, mujocoZ, -mujocoY)
}

function mujocoQuatToThree(quatW: number, quatX: number, quatY: number, quatZ: number): THREE.Quaternion {
  // MuJoCo quat (w,x,y,z) Z-up -> Three.js Y-up: swap and negate as in physics viewer
  return new THREE.Quaternion(quatX, quatZ, quatY, quatW)
}

// Body order in marionette.xml (depth-first from worldbody): world=0, handle=1, puppet=2, torso=3, head=4, l_upperarm=5, l_forearm=6, r_upperarm=7, r_forearm=8, l_thigh=9, l_shin=10, r_thigh=11, r_shin=12
const BODY_IDS: Record<string, number> = {
  handle: 1,
  puppet: 2,
  torso: 3,
  head: 4,
  l_upperarm: 5,
  l_forearm: 6,
  r_upperarm: 7,
  r_forearm: 8,
  l_thigh: 9,
  l_shin: 10,
  r_thigh: 11,
  r_shin: 12,
}

// Actuator order in XML: a_head, a_chest, a_l_hand, a_r_hand, a_l_sh, a_r_sh, a_l_foot, a_r_foot
const ACTUATOR_NAMES = ['head', 'chest', 'leftHand', 'rightHand', 'leftShoulder', 'rightShoulder', 'leftFoot', 'rightFoot'] as const

export interface MuJoCoBodyPose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

export interface MuJoCoActuatorControls {
  head?: number
  torso?: number
  chest?: number
  leftHand?: number
  rightHand?: number
  leftShoulder?: number
  rightShoulder?: number
  leftFoot?: number
  rightFoot?: number
}

export interface UseMuJoCoReturn {
  isLoaded: boolean
  error: string | null
  step: (dt?: number) => void
  setHandlePosition: (threePos: THREE.Vector3) => void
  setActuators: (controls: MuJoCoActuatorControls) => void
  getBodyPose: (bodyName: string) => MuJoCoBodyPose | null
  bodyNames: string[]
}

export function useMuJoCo(): UseMuJoCoReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mujocoRef = useRef<{
    MjModel: { loadFromXML: (path: string) => unknown }
    MjData: new (model: unknown) => { qpos: Float32Array; qvel?: Float32Array; ctrl?: Float32Array; xpos: Float32Array; xquat: Float32Array }
    FS: { mkdir: (p: string) => void; mount: (a: unknown, b: unknown, c: string) => void; writeFile: (p: string, s: string) => void }
    mj_resetData?: (model: unknown, data: unknown) => void
    MjResetData?: (model: unknown, data: unknown) => void
    mj_step?: (model: unknown, data: unknown) => void
    MjStep?: (model: unknown, data: unknown) => void
    mj_versionString?: () => string
    MEMFS?: unknown
  } | null>(null)
  const modelRef = useRef<{ nbody: number } | null>(null)
  const dataRef = useRef<{ qpos: Float32Array; ctrl?: Float32Array; xpos: Float32Array; xquat: Float32Array } | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const loadMujoco = (await import('mujoco-js')).default
        const mujoco = await loadMujoco()
        if (cancelled) return
        mujocoRef.current = mujoco

        if (mujoco.FS) {
          mujoco.FS.mkdir('/working')
          mujoco.FS.mount(mujoco.MEMFS, { root: '.' }, '/working')
        }
        const xmlRes = await fetch('/marionette.xml')
        if (!xmlRes.ok) throw new Error('Failed to fetch marionette.xml')
        const xml = await xmlRes.text()
        mujoco.FS.writeFile('/working/marionette.xml', xml)

        const model = mujoco.MjModel.loadFromXML('/working/marionette.xml') as { nbody: number }
        if (!model) throw new Error('Failed to load MuJoCo model')
        if (cancelled) return
        modelRef.current = model

        const data = new mujoco.MjData(model) as { qpos: Float32Array; ctrl?: Float32Array; xpos: Float32Array; xquat: Float32Array }
        if (cancelled) return
        dataRef.current = data

        if (mujoco.mj_resetData) {
          mujoco.mj_resetData(model, data)
        } else if (mujoco.MjResetData) {
          mujoco.MjResetData(model, data)
        }

        // Initial handle position (MuJoCo Z-up): e.g. 0, 0, 2.5
        const qpos = data.qpos
        if (qpos && qpos.length >= 7) {
          qpos[0] = 0
          qpos[1] = 0
          qpos[2] = 2.5
          qpos[3] = 1
          qpos[4] = 0
          qpos[5] = 0
          qpos[6] = 0
        }

        if (!cancelled) {
          const mjVersion = typeof mujoco.mj_versionString === 'function' ? mujoco.mj_versionString() : 'unknown'
          const commit = typeof import.meta.env?.VITE_GIT_COMMIT === 'string' ? import.meta.env.VITE_GIT_COMMIT : 'unknown'
          console.log('[MuJoCo] Running: model loaded, marionette.xml ready — MuJoCo', mjVersion, 'commit', commit)
          setIsLoaded(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load MuJoCo')
          console.error('MuJoCo init error:', err)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  const step = useCallback((dt?: number) => {
    const mj = mujocoRef.current
    const model = modelRef.current
    const data = dataRef.current
    if (!mj || !model || !data) return
    const stepSize = dt ?? 0.002
    const n = Math.max(1, Math.round(stepSize / 0.002))
    for (let i = 0; i < n; i++) {
      if (mj.mj_step) mj.mj_step(model, data)
      else if (mj.MjStep) mj.MjStep(model, data)
    }
  }, [])

  const setHandlePosition = useCallback((threePos: THREE.Vector3) => {
    const data = dataRef.current
    if (!data?.qpos || data.qpos.length < 7) return
    const [mx, my, mz] = threeToMujocoPos(threePos)
    data.qpos[0] = mx
    data.qpos[1] = my
    data.qpos[2] = mz
    // Keep quat identity (handle upright)
    data.qpos[3] = 1
    data.qpos[4] = 0
    data.qpos[5] = 0
    data.qpos[6] = 0
  }, [])

  const setActuators = useCallback((controls: MuJoCoActuatorControls) => {
    const data = dataRef.current
    if (!data?.ctrl) return
    const ctrl = data.ctrl
    // Position actuators: target tendon length. Pull (0-1) -> shorter target. Use 0.5 - pull*0.3 as target.
    const get = (key: keyof MuJoCoActuatorControls) => {
      const v = controls[key]
      if (typeof v === 'number') return v
      if (key === 'chest') return controls.torso ?? 0
      return 0
    }
    const pullToTarget = (pull: number) => 0.5 - Math.max(0, Math.min(1, pull)) * 0.35
    if (ctrl.length >= 8) {
      ctrl[0] = pullToTarget(get('head'))
      ctrl[1] = pullToTarget(get('chest'))
      ctrl[2] = pullToTarget(get('leftHand'))
      ctrl[3] = pullToTarget(get('rightHand'))
      ctrl[4] = pullToTarget(get('leftShoulder'))
      ctrl[5] = pullToTarget(get('rightShoulder'))
      ctrl[6] = pullToTarget(get('leftFoot'))
      ctrl[7] = pullToTarget(get('rightFoot'))
    }
  }, [])

  const getBodyPose = useCallback((bodyName: string): MuJoCoBodyPose | null => {
    const model = modelRef.current
    const data = dataRef.current
    if (!model || !data?.xpos || !data.xquat) return null
    const bodyId = BODY_IDS[bodyName]
    if (bodyId == null) return null
    const nbody = model.nbody ?? 0
    if (bodyId >= nbody) return null
    const posIdx = bodyId * 3
    const quatIdx = bodyId * 4
    const position = mujocoToThreePos(
      data.xpos[posIdx],
      data.xpos[posIdx + 1],
      data.xpos[posIdx + 2]
    )
    const quaternion = mujocoQuatToThree(
      data.xquat[quatIdx],
      data.xquat[quatIdx + 1],
      data.xquat[quatIdx + 2],
      data.xquat[quatIdx + 3]
    )
    return { position, quaternion }
  }, [])

  const bodyNames = Object.keys(BODY_IDS)

  return {
    isLoaded,
    error,
    step,
    setHandlePosition,
    setActuators,
    getBodyPose,
    bodyNames,
  }
}
