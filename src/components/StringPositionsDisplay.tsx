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

export default function StringPositionsDisplay({
  controllerPositions,
  stringStartPositions,
  stringEndPositions,
  puppetPositions
}: StringPositionsDisplayProps) {
  // Match MuJoCo string names and order: t_head, t_chest, t_l_hand, t_r_hand, t_l_shoulder, t_r_shoulder, t_l_foot, t_r_foot
  const controlPoints = [
    { key: 'head', label: 't_head', muJoCoName: 't_head' },
    { key: 'chest', label: 't_chest', muJoCoName: 't_chest' },
    { key: 'leftHand', label: 't_l_hand', muJoCoName: 't_l_hand' },
    { key: 'rightHand', label: 't_r_hand', muJoCoName: 't_r_hand' },
    { key: 'leftShoulder', label: 't_l_shoulder', muJoCoName: 't_l_shoulder' },
    { key: 'rightShoulder', label: 't_r_shoulder', muJoCoName: 't_r_shoulder' },
    { key: 'leftFoot', label: 't_l_foot', muJoCoName: 't_l_foot' },
    { key: 'rightFoot', label: 't_r_foot', muJoCoName: 't_r_foot' },
  ] as const

  const formatPosition = (pos: StringPosition | undefined): string => {
    if (!pos) return '---'
    return `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`
  }

  const getPosition = (positions: StringPositions | undefined, key: string): StringPosition | undefined => {
    if (!positions) return undefined
    return positions[key as keyof StringPositions]
  }

  return (
    <div className="string-positions-display">
      <table className="positions-table">
        <thead>
          <tr>
            <th className="row-header">Point</th>
            {controlPoints.map(point => (
              <th key={point.key} className="column-header">{point.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="row-label">Controller</td>
            {controlPoints.map(point => (
              <td key={point.key} className="position-cell">
                {formatPosition(getPosition(controllerPositions, point.key))}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String Start</td>
            {controlPoints.map(point => (
              <td key={point.key} className="position-cell">
                {formatPosition(getPosition(stringStartPositions, point.key))}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">String End</td>
            {controlPoints.map(point => (
              <td key={point.key} className="position-cell">
                {formatPosition(getPosition(stringEndPositions, point.key))}
              </td>
            ))}
          </tr>
          <tr>
            <td className="row-label">Puppet</td>
            {controlPoints.map(point => (
              <td key={point.key} className="position-cell">
                {formatPosition(getPosition(puppetPositions, point.key))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
