import './ControlBarDisplay.css'

interface TimingSnapshot {
  simTime: number
  realTime: number
  fps: number
  realtimeRatio: number
}

interface ControlBarDisplayProps {
  controlBarPosition: { x: number; y: number; z: number }
  controlBarRotation: { roll: number; pitch: number; yaw: number }
  cameraPosition?: { x: number; y: number; z: number }
  cameraRotation?: { roll: number; pitch: number; yaw: number }
  timing?: TimingSnapshot | null
}

export default function ControlBarDisplay({ 
  controlBarPosition, 
  controlBarRotation,
  cameraPosition,
  cameraRotation,
  timing
}: ControlBarDisplayProps) {
  // Convert radians to degrees for display
  const controlRollDeg = (controlBarRotation.roll * 180 / Math.PI).toFixed(1)
  const controlPitchDeg = (controlBarRotation.pitch * 180 / Math.PI).toFixed(1)
  const controlYawDeg = (controlBarRotation.yaw * 180 / Math.PI).toFixed(1)

  const cameraRollDeg = cameraRotation ? (cameraRotation.roll * 180 / Math.PI).toFixed(1) : '0.0'
  const cameraPitchDeg = cameraRotation ? (cameraRotation.pitch * 180 / Math.PI).toFixed(1) : '0.0'
  const cameraYawDeg = cameraRotation ? (cameraRotation.yaw * 180 / Math.PI).toFixed(1) : '0.0'

  return (
    <div className="control-bar-display">
      {/* Timing: sim time, real time, FPS, realtime estimate */}
      {timing && (
        <div className="display-group">
          <div className="display-section">
            <span className="label">Sim time:</span>
            <span className="value">{timing.simTime.toFixed(2)}s</span>
          </div>
          <div className="display-section">
            <span className="label">Real time:</span>
            <span className="value">{timing.realTime.toFixed(2)}s</span>
          </div>
          <div className="display-section">
            <span className="label">FPS:</span>
            <span className="value">{Math.round(timing.fps)}</span>
          </div>
          <div className="display-section">
            <span className="label">Realtime:</span>
            <span className="value" title="Sim time / real time; 1.0 = realtime, &gt;1 = faster, &lt;1 = slower">
              {(timing.realtimeRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Control Bar Info */}
      <div className="display-group">
        <div className="display-section">
          <span className="label">Control Bar Position:</span>
          <span className="value">X: {controlBarPosition.x.toFixed(2)}</span>
          <span className="value">Y: {controlBarPosition.y.toFixed(2)}</span>
          <span className="value">Z: {controlBarPosition.z.toFixed(2)}</span>
        </div>
        <div className="display-section">
          <span className="label">Control Bar Rotation:</span>
          <span className="value">Roll: {controlRollDeg}°</span>
          <span className="value">Pitch: {controlPitchDeg}°</span>
          <span className="value">Yaw: {controlYawDeg}°</span>
        </div>
      </div>
      
      {/* Camera Info */}
      {cameraPosition && cameraRotation && (
        <div className="display-group">
          <div className="display-section">
            <span className="label">Camera Position:</span>
            <span className="value">X: {cameraPosition.x.toFixed(2)}</span>
            <span className="value">Y: {cameraPosition.y.toFixed(2)}</span>
            <span className="value">Z: {cameraPosition.z.toFixed(2)}</span>
          </div>
          <div className="display-section">
            <span className="label">Camera Rotation:</span>
            <span className="value">Roll: {cameraRollDeg}°</span>
            <span className="value">Pitch: {cameraPitchDeg}°</span>
            <span className="value">Yaw: {cameraYawDeg}°</span>
          </div>
        </div>
      )}
    </div>
  )
}
