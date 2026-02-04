import { useState, useCallback } from 'react'
import { MotionSequence } from './types'
import { generateMotionSequence } from './motionGenerator'

export function useLLMController() {
  const [currentSequence, setCurrentSequence] = useState<MotionSequence | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeCommand = useCallback(async (command: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Generate motion sequence from LLM
      const sequence = await generateMotionSequence(command)
      setCurrentSequence(sequence)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command'
      setError(errorMessage)
      console.error('LLM command execution error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    executeCommand,
    currentSequence,
    isProcessing,
    error,
  }
}
