/**
 * Device fingerprinting for anonymous submissions
 * Generates a consistent hash per device without storing identifiable data
 */

// Simple hash function (djb2 algorithm)
function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i) // hash * 33 + c
  }
  return (hash >>> 0).toString(16)
}

// Get canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Openly fingerprint', 2, 15)
    
    return canvas.toDataURL().slice(-50) // Take last 50 chars
  } catch {
    return ''
  }
}

// Collect device signals
function collectDeviceSignals(): string {
  const signals: string[] = []
  
  // User agent
  signals.push(navigator.userAgent)
  
  // Screen resolution
  signals.push(`${screen.width}x${screen.height}`)
  
  // Timezone
  signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone)
  
  // Language
  signals.push(navigator.language)
  
  // Color depth
  signals.push(screen.colorDepth.toString())
  
  // Platform
  signals.push(navigator.platform)
  
  // Canvas fingerprint
  signals.push(getCanvasFingerprint())
  
  return signals.join('|')
}

// Generate device hash
export function generateDeviceHash(): string {
  const signals = collectDeviceSignals()
  return hashString(signals)
}

// Get or create device hash from localStorage
export function getDeviceHash(): string {
  if (typeof window === 'undefined') return ''
  
  let hash = localStorage.getItem('openly_device_hash')
  
  if (!hash) {
    hash = generateDeviceHash()
    localStorage.setItem('openly_device_hash', hash)
  }
  
  return hash
}

// Check if device has already submitted for a room
export function hasSubmitted(roomId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const submittedRooms = JSON.parse(
    localStorage.getItem('openly_submitted_rooms') || '[]'
  )
  
  return submittedRooms.includes(roomId)
}

// Mark room as submitted for this device
export function markAsSubmitted(roomId: string): void {
  if (typeof window === 'undefined') return
  
  const submittedRooms = JSON.parse(
    localStorage.getItem('openly_submitted_rooms') || '[]'
  )
  
  if (!submittedRooms.includes(roomId)) {
    submittedRooms.push(roomId)
    localStorage.setItem('openly_submitted_rooms', JSON.stringify(submittedRooms))
  }
}
