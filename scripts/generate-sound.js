// Notification sound generation script
// Creates a pleasant notification tone using Web Audio API

const generateNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const sampleRate = audioContext.sampleRate
  const duration = 0.4 // 400ms
  const frequency1 = 880 // A5
  const frequency2 = 1174.66 // D6 (perfect fourth up)
  
  const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate)
  const data = buffer.getChannelData(0)
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-5 * t)
    
    // Two tones for a pleasant chord
    const tone1 = Math.sin(2 * Math.PI * frequency1 * t)
    const tone2 = Math.sin(2 * Math.PI * frequency2 * t)
    
    data[i] = (tone1 * 0.3 + tone2 * 0.2) * envelope
  }
  
  return buffer
}

// Convert buffer to base64 WAV format for embedding
// This would be used to create public/sounds/notification.wav
