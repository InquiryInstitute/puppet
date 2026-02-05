import './StringPositionsDisplay.css'

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

interface StringPositionsDisplayProps {
  controllerPositions?: StringPositions
  stringStartPositions?: StringPositions
  stringEndPositions?: StringPositions
  puppetPositions?: StringPositions
  forces?: StringPositions
  torques?: StringPositions
  selectedStringIndex?: number | null
  stringRestLengths?: Map<string, number>
}

const CONTROL_POINTS = [
  'head',
  'chest',
  'leftHand',
  'rightHand',
  'leftShoulder',
  'rightShoulder',
  'leftFoot',
  'rightFoot'
] as const

const formatPosition = (pos: StringPosition | undefined): string => {
  if (!pos) return 'N/A'
  return `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`
}

/** Convert scene coords to MuJoCo world: Y-up vs Z-up. */
function toMuJoCoCoords(pos: StringPosition | undefined): string {
  if (!pos) return 'N/A'
  const x_mj = pos.x
  const y_mj = pos.z
  const z_mj = pos.y
  return `${x_mj.toFixed(3)} ${y_mj.toFixed(3)} ${z_mj.toFixed(3)}`
}

const formatVector = (v: StringPosition | undefined, magnitudeUnit = ''): string => {
  if (!v) return 'N/A'
  const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  const magStr = magnitudeUnit ? ` |${mag.toFixed(3)} ${magnitudeUnit}|` : ''
  return `${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)}${magStr}`
}

const calculateDistance = (start: StringPosition | undefined, end: StringPosition | undefined): number => {
  if (!start || !end) return 0
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dz = end.z - start.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export default function StringPositionsDisplay({
  controllerPositions,
  stringStartPositions,
  stringEndPositions,
  puppetPositions,
  forces,
  torques,
  selectedStringIndex = null,
}: StringPositionsDisplayProps) {
  return (
    <div className="string-positions-display">
      <table className="positions-table">
        <thead>
          <tr>
            <th className="row-label">Position</th>
            {CONTROL_POINTS.map((point, index) => (
              <th 
                key={point} 
                className={`control-point-header ${selectedStringIndex === index ? 'selected' : ''}`}
              >
                {point}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="row-label">Controller</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {formatPosition(controllerPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String Start</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {formatPosition(stringEndPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String Length</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {calculateDistance(stringEndPositions?.[point], stringStartPositions?.[point]).toFixed(3)}m
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String End</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {formatPosition(stringStartPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">Puppet</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {formatPosition(puppetPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">MuJoCo (puppet)</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell" title="World frame: X Y Z (Z up)">
                {toMuJoCoCoords(puppetPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">Force (N)</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell" title="String tension force at attachment">
                {formatVector(forces?.[point], 'N')}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">Torque (N·m)</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell" title="Joint torque at corresponding joint">
                {formatVector(torques?.[point], 'N·m')}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
