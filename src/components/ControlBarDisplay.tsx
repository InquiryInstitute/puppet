import './ControlBarDisplay.css'

interface ControlBarDisplayProps {
  position: { x: number; y: number; z: number }
  rotation: { roll: number; pitch: number; yaw: number }
}

export default function ControlBarDisplay({ position, rotation }: ControlBarDisplayProps) {
  // Convert radians to degrees for display
  const rollDeg = (rotation.roll * 180 / Math.PI).toFixed(1)
  const pitchDeg = (rotation.pitch * 180 / Math.PI).toFixed(1)
  const yawDeg = (rotation.yaw * 180 / Math.PI).toFixed(1)

  return (
    <div className="control-bar-display">
      <div className="display-section">
        <span className="label">Position:</span>
        <span className="value">X: {position.x.toFixed(2)}</span>
        <span className="value">Y: {position.y.toFixed(2)}</span>
        <span className="value">Z: {position.z.toFixed(2)}</span>
      </div>
      <div className="display-section">
        <span className="label">Rotation:</span>
        <span className="value">Roll: {rollDeg}°</span>
        <span className="value">Pitch: {pitchDeg}°</span>
        <span className="value">Yaw: {yawDeg}°</span>
      </div>
    </div>
  )
}
