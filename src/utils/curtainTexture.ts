import * as THREE from 'three'

export function createCurtainTexture(width: number, height: number): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Fill with base red color
  ctx.fillStyle = '#8B0000' // Dark red
  ctx.fillRect(0, 0, width, height)

  // Add vertical folds (darker red lines)
  const foldCount = 8
  const foldWidth = width / foldCount
  
  for (let i = 0; i <= foldCount; i++) {
    const x = i * foldWidth
    const gradient = ctx.createLinearGradient(x, 0, x + foldWidth * 0.3, 0)
    gradient.addColorStop(0, 'rgba(139, 0, 0, 0.8)') // Dark red
    gradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.4)') // Lighter in middle
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.8)') // Dark red
    
    ctx.fillStyle = gradient
    ctx.fillRect(x - foldWidth * 0.15, 0, foldWidth * 0.3, height)
  }

  // Add horizontal highlights (simulating light from top)
  const highlightGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3)
  highlightGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)') // Bright red at top
  highlightGradient.addColorStop(1, 'rgba(255, 0, 0, 0)') // Fade out
  
  ctx.fillStyle = highlightGradient
  ctx.fillRect(0, 0, width, height * 0.3)

  // Add texture (fabric-like pattern)
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const radius = Math.random() * 3 + 1
    const opacity = Math.random() * 0.1 + 0.05
    const color = `rgba(${Math.random() > 0.5 ? '200' : '100'}, 0, 0, ${opacity})`

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  // Add some gold trim at the top (optional)
  ctx.fillStyle = '#D4AF37' // Gold
  ctx.fillRect(0, 0, width, height * 0.05)

  // Add gold trim pattern
  ctx.strokeStyle = '#B8860B' // Darker gold
  ctx.lineWidth = 2
  for (let i = 0; i < width; i += 20) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height * 0.05)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  return texture
}
