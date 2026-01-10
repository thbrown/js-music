// Shared audio utilities for playing notes

const SEMITONE_RATIO = Math.pow(2, 1 / 12); // 12th root of 2

export interface NotePlayOptions {
  frequency: number;        // Base frequency (e.g., 261.63 for middle C)
  oscillatorType: OscillatorType;
  duration?: number;        // Note duration in seconds (default: 0.2)
  gain?: number;            // Volume 0-1 (default: 0.5)
}

/**
 * Calculate the frequency for a given row position
 */
export function calculateFrequency(
  row: number,
  middleCPosition: number,
  baseFrequency: number
): number {
  const semitoneOffset = middleCPosition - row;
  return baseFrequency * Math.pow(SEMITONE_RATIO, semitoneOffset);
}

/**
 * Play a single note immediately
 * Returns the AudioContext for cleanup if needed
 */
export function playNote(
  row: number,
  middleCPosition: number,
  options: NotePlayOptions
): AudioContext {
  const { frequency, oscillatorType, duration = 0.2, gain = 0.5 } = options;

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Calculate frequency for this row
  oscillator.frequency.value = calculateFrequency(row, middleCPosition, frequency);
  oscillator.type = oscillatorType;

  // Envelope: quick attack, sustain, then fade out
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);

  // Clean up after note finishes
  oscillator.onended = () => {
    oscillator.disconnect();
    gainNode.disconnect();
    audioContext.close();
  };

  return audioContext;
}

/**
 * Schedule a note to play at a specific time (for composition playback)
 */
export function scheduleNote(
  audioContext: AudioContext,
  row: number,
  middleCPosition: number,
  startTime: number,
  options: NotePlayOptions
): OscillatorNode {
  const { frequency, oscillatorType, duration = 0.2, gain = 0.5 } = options;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Calculate frequency for this row
  oscillator.frequency.value = calculateFrequency(row, middleCPosition, frequency);
  oscillator.type = oscillatorType;

  // Set gain
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return oscillator;
}
