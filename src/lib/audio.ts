/**
 * All sound effects are synthesized on the fly with square/triangle
 * oscillators — deliberately "chiptune" and dependency-free. A single
 * shared AudioContext is lazily created on first use so the app never
 * asks for audio permission before the user actually interacts with it.
 */

type WaveShape = OscillatorType;

interface Note {
  freq: number;
  start: number;
  duration: number;
  shape?: WaveShape;
  gain?: number;
}

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function playNote(audioCtx: AudioContext, note: Note, masterGain: number) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = note.shape ?? "square";
  osc.frequency.value = note.freq;

  const startAt = audioCtx.currentTime + note.start;
  const endAt = startAt + note.duration;
  const peak = (note.gain ?? 0.25) * masterGain;

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), startAt + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(endAt + 0.02);
}

function playSequence(notes: Note[], masterGain = 1) {
  const audioCtx = getContext();
  notes.forEach((note) => playNote(audioCtx, note, masterGain));
}

/** Soft two-blip UI click — buttons, toggles, checkbox taps. */
export function playClick(masterGain = 1) {
  playSequence(
    [{ freq: 660, start: 0, duration: 0.045, shape: "square", gain: 0.15 }],
    masterGain,
  );
}

/** Ascending arpeggio for completing a task. */
export function playTaskComplete(masterGain = 1) {
  playSequence(
    [
      { freq: 523.25, start: 0, duration: 0.09, shape: "square", gain: 0.2 },
      { freq: 659.25, start: 0.08, duration: 0.09, shape: "square", gain: 0.2 },
      { freq: 783.99, start: 0.16, duration: 0.14, shape: "square", gain: 0.22 },
    ],
    masterGain,
  );
}

/** Bright fanfare for a completed Pomodoro session. */
export function playTimerComplete(masterGain = 1) {
  playSequence(
    [
      { freq: 523.25, start: 0, duration: 0.12, shape: "square", gain: 0.22 },
      { freq: 523.25, start: 0.12, duration: 0.12, shape: "square", gain: 0.22 },
      { freq: 659.25, start: 0.24, duration: 0.12, shape: "square", gain: 0.24 },
      { freq: 783.99, start: 0.36, duration: 0.28, shape: "triangle", gain: 0.28 },
    ],
    masterGain,
  );
}

/** Low descending blip for cancel / reset (pairs with the death animation). */
export function playReset(masterGain = 1) {
  playSequence(
    [
      { freq: 392, start: 0, duration: 0.08, shape: "triangle", gain: 0.18 },
      { freq: 293.66, start: 0.07, duration: 0.1, shape: "triangle", gain: 0.16 },
      { freq: 220, start: 0.15, duration: 0.16, shape: "triangle", gain: 0.14 },
    ],
    masterGain,
  );
}

/** Short pop for opening/closing the to-do drawer. */
export function playWhoosh(masterGain = 1) {
  playSequence(
    [{ freq: 440, start: 0, duration: 0.06, shape: "sine", gain: 0.12 }],
    masterGain,
  );
}
