import './ControlBarDisplay.css'

interface ControlBarDisplayProps {
  controlBarPosition: { x: number; y: number; z: number }
  controlBarRotation: { roll: number; pitch: number; yaw: number }
  cameraPosition?: { x: number; y: number; z: number }
  cameraRotation?: { roll: number; pitch: number; yaw: number }
}

export default function ControlBarDisplay({ 
  controlBarPosition, 
  controlBarRotation,
  cameraPosition,
  cameraRotation
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
