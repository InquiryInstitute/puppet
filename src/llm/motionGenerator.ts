import { MotionSequence, MotionStep, BodyRotations } from './types'

// Placeholder for LLM API integration
// In production, this would call OpenRouter API or similar
async function callLLM(prompt: string): Promise<string> {
  // TODO: Integrate with OpenRouter API
  // For now, return a structured response based on keyword matching
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('wave') || lowerPrompt.includes('hello')) {
    return JSON.stringify({
      action: 'wave',
      steps: [
        { part: 'rightArm', rotation: { x: -0.5, y: 0.3, z: 0 }, duration: 0.5 },
        { part: 'rightArm', rotation: { x: -0.8, y: 0.5, z: 0 }, duration: 0.3 },
        { part: 'rightArm', rotation: { x: -0.5, y: 0.3, z: 0 }, duration: 0.3 },
        { part: 'rightArm', rotation: { x: 0, y: 0, z: 0 }, duration: 0.2 },
      ]
    })
  }
  
  if (lowerPrompt.includes('dance')) {
    return JSON.stringify({
      action: 'dance',
      steps: [
        { part: 'leftArm', rotation: { x: -0.5, y: 0.2 }, duration: 0.4 },
        { part: 'rightArm', rotation: { x: -0.5, y: -0.2 }, duration: 0.4 },
        { part: 'leftLeg', rotation: { x: 0.3 }, duration: 0.3 },
        { part: 'rightLeg', rotation: { x: 0.3 }, duration: 0.3 },
        { part: 'torso', rotation: { y: 0.2 }, duration: 0.5 },
        { part: 'torso', rotation: { y: -0.2 }, duration: 0.5 },
      ]
    })
  }
  
  if (lowerPrompt.includes('bow')) {
    return JSON.stringify({
      action: 'bow',
      steps: [
        { part: 'torso', rotation: { x: 0.3 }, duration: 0.5 },
        { part: 'head', rotation: { x: 0.2 }, duration: 0.3 },
        { part: 'torso', rotation: { x: 0 }, duration: 0.5 },
        { part: 'head', rotation: { x: 0 }, duration: 0.3 },
      ]
    })
  }
  
  // Default: simple movement
  return JSON.stringify({
    action: 'move',
    steps: [
      { part: 'head', rotation: { y: 0.2 }, duration: 0.5 },
      { part: 'head', rotation: { y: -0.2 }, duration: 0.5 },
      { part: 'head', rotation: { y: 0 }, duration: 0.3 },
    ]
  })
}

export async function generateMotionSequence(command: string): Promise<MotionSequence> {
  console.log('[motionGenerator] generateMotionSequence called with:', command)
  // Call LLM to generate motion sequence
  const llmResponse = await callLLM(
    `Generate a motion sequence for a marionette puppet to: ${command}. ` +
    `Return a JSON object with an action name and an array of steps. ` +
    `Each step should have: part (head, torso, leftArm, rightArm, leftLeg, rightLeg), ` +
    `rotation (object with x, y, z in radians), and duration (seconds).`
  )
  console.log('[motionGenerator] LLM response:', llmResponse)

  try {
    const parsed = JSON.parse(llmResponse)
    console.log('[motionGenerator] Parsed response:', parsed)
    const steps: MotionStep[] = []
    let currentTime = 0

    for (const stepData of parsed.steps || []) {
      const rotations: BodyRotations = {}
      
      // Map part to body rotations
      if (stepData.part === 'head') {
        rotations.head = stepData.rotation
      } else if (stepData.part === 'torso') {
        rotations.torso = stepData.rotation
      } else if (stepData.part === 'leftArm') {
        rotations.leftArm = stepData.rotation
      } else if (stepData.part === 'rightArm') {
        rotations.rightArm = stepData.rotation
      } else if (stepData.part === 'leftLeg') {
        rotations.leftLeg = stepData.rotation
      } else if (stepData.part === 'rightLeg') {
        rotations.rightLeg = stepData.rotation
      }

      steps.push({
        startTime: currentTime,
        duration: stepData.duration || 0.5,
        rotations,
      })

      currentTime += stepData.duration || 0.5
    }

    return {
      steps,
      totalDuration: currentTime,
    }
  } catch (error) {
    console.error('Failed to parse LLM response:', error)
    // Return a default sequence
    return {
      steps: [
        {
          startTime: 0,
          duration: 1,
          rotations: {
            head: { y: 0.2 },
          },
        },
      ],
      totalDuration: 1,
    }
  }
}
