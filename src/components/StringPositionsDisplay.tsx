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

export default function StringPositionsDisplay({
  controllerPositions,
  stringStartPositions,
  stringEndPositions,
  puppetPositions
}: StringPositionsDisplayProps) {
  return (
    <div className="string-positions-display">
      <table className="positions-table">
        <thead>
          <tr>
            <th className="row-label">Position</th>
            {CONTROL_POINTS.map(point => (
              <th key={point} className="control-point-header">
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
                {formatPosition(stringStartPositions?.[point])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String End</td>
            {CONTROL_POINTS.map(point => (
              <td key={point} className="position-cell">
                {formatPosition(stringEndPositions?.[point])}
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
        </tbody>
      </table>
    </div>
  )
}
