export function float32To16BitPCM(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm16;
}

export function base64EncodeAudio(pcm16: Int16Array): string {
  const buffer = new ArrayBuffer(pcm16.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(i * 2, pcm16[i], true); // true for little-endian
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const buffer = bytes.buffer;
  const view = new DataView(buffer);
  const float32 = new Float32Array(buffer.byteLength / 2);
  for (let i = 0; i < float32.length; i++) {
    float32[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return float32;
}

export class AudioStreamStreamer {
  private audioCtx: AudioContext;
  private nextStartTime: number;

  constructor(targetSampleRate: number = 24000) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: targetSampleRate });
    this.nextStartTime = this.audioCtx.currentTime;
  }

  playBase64(base64: string) {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const float32 = base64ToFloat32(base64);
    const audioBuffer = this.audioCtx.createBuffer(1, float32.length, this.audioCtx.sampleRate);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    
    const startTime = Math.max(this.audioCtx.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  stop() {
    this.nextStartTime = this.audioCtx.currentTime;
    // We would need to keep track of sources to actually stop them,
    // but for simplicity we just reset nextStartTime to let new audio interrupt
  }

  close() {
    this.audioCtx.close();
  }
}
