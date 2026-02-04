import { useState } from 'react'
import './ControlPanel.css'

interface ControlPanelProps {
  onCommand: (command: string) => void
  isExecuting: boolean
}

export default function ControlPanel({ onCommand, isExecuting }: ControlPanelProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isExecuting) return

    const command = input.trim()
    setHistory(prev => [command, ...prev].slice(0, 10))
    setInput('')
    onCommand(command)
  }

  const quickCommands = [
    'wave hello',
    'dance',
    'bow',
    'jump',
    'walk forward',
    'sit down',
    'stand up',
    'spin around'
  ]

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2>Puppet Control</h2>
        <p className="subtitle">LLM-Driven Marionette</p>
      </div>

      <form onSubmit={handleSubmit} className="command-form">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter command (e.g., 'make the puppet wave')"
            disabled={isExecuting}
            className="command-input"
          />
          <button
            type="submit"
            disabled={isExecuting || !input.trim()}
            className="submit-button"
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </form>

      <div className="quick-commands">
        <h3>Quick Commands</h3>
        <div className="quick-buttons">
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInput(cmd)
                onCommand(cmd)
              }}
              disabled={isExecuting}
              className="quick-button"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="command-history">
          <h3>History</h3>
          <ul>
            {history.map((cmd, idx) => (
              <li key={idx} onClick={() => setInput(cmd)}>
                {cmd}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="status">
        <div className={`status-indicator ${isExecuting ? 'executing' : 'idle'}`} />
        <span>{isExecuting ? 'Executing command...' : 'Ready'}</span>
      </div>
    </div>
  )
}
