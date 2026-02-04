import * as THREE from 'three'

export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  
  // Base wood color (warm brown)
  const baseColor = '#8B6F47'
  const darkGrain = '#6B4E2F'
  const lightGrain = '#A6895F'
  
  // Fill with base color
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Create wood grain pattern
  for (let i = 0; i < canvas.height; i += 2) {
    // Vary the grain color slightly
    const variation = Math.sin(i * 0.1) * 0.3 + Math.random() * 0.2
    const grainColor = variation > 0 ? lightGrain : darkGrain
    
    ctx.strokeStyle = grainColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, i)
    
    // Create wavy grain lines
    for (let x = 0; x < canvas.width; x += 10) {
      const y = i + Math.sin(x * 0.05 + i * 0.1) * 2 + Math.random() * 1
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  
  // Add some knots and imperfections
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = 20 + Math.random() * 30
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, darkGrain)
    gradient.addColorStop(0.5, baseColor)
    gradient.addColorStop(1, baseColor)
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Add board lines (planks)
  ctx.strokeStyle = darkGrain
  ctx.lineWidth = 2
  const boardWidth = canvas.width / 6 // 6 planks
  for (let i = 1; i < 6; i++) {
    const x = i * boardWidth
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4) // Repeat the texture for larger stage
  texture.anisotropy = 16 // Better quality
  
  return texture
}
