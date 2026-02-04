import { useState, useCallback } from 'react'
import { MotionSequence } from './types'
import { generateMotionSequence } from './motionGenerator'

export function useLLMController() {
  const [currentSequence, setCurrentSequence] = useState<MotionSequence | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeCommand = useCallback(async (command: string) => {
    console.log('[useLLMController] executeCommand called with:', command)
    setIsProcessing(true)
    setError(null)

    try {
      // Generate motion sequence from LLM
      console.log('[useLLMController] Calling generateMotionSequence...')
      const sequence = await generateMotionSequence(command)
      console.log('[useLLMController] Generated sequence:', sequence)
      setCurrentSequence(sequence)
      console.log('[useLLMController] Sequence set in state')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command'
      setError(errorMessage)
      console.error('[useLLMController] Error:', err)
    } finally {
      setIsProcessing(false)
      console.log('[useLLMController] Processing complete')
    }
  }, [])

  return {
    executeCommand,
    currentSequence,
    isProcessing,
    error,
  }
}
