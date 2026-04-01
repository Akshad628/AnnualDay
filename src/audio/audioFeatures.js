/*
 * FILE: src/audio/audioFeatures.js
 * SYSTEM: Audio Math / Analysis
 * RESPONSIBILITY: Takes raw Web Audio API byte data and extracts human-readable normalized bands (Bass, Mids, Highs, Overall Level, and Transient Peaks).
 * INTERACTION: Called purely by audioInput.js on every frame.
 * VISUAL RESULT: The outputs of this file (e.g. `bass`, `peak`) are the lifeblood of the visual reactivity. If bass spikes, nodes swell. If level drops, particle opacity dims.
 */

/**
 * Normalizes a value to strictly fall within 0.0 and 1.0.
 * WHY: Visuals expect values between 0 and 1 so they can easily be multiplied against base configuration values without creating wild layout explosions.
 */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Calculates the average volume/intensity across a given slice of the frequency spectrum.
 * @param {Uint8Array} data The raw frequency data from the AnalyserNode
 * @param {number} startBin The array index representing the lowest frequency of the band
 * @param {number} endBin The array index representing the highest frequency
 */
function averageRange(data, startBin, endBin) {
  const safeStart = Math.max(0, startBin);
  const safeEnd = Math.min(data.length - 1, endBin);

  if (safeEnd < safeStart) return 0;

  let sum = 0;
  let count = 0;

  for (let i = safeStart; i <= safeEnd; i++) {
    sum += data[i];
    count++;
  }

  return count > 0 ? sum / count : 0;
}

/**
 * The core mathematical extraction engine for audio features.
 * 
 * WHY IS THIS COMPLICATED? Raw audio data is extremely noisy/jagged. If we drove visuals directly from it, 
 * the graphics would strobe violently. This function mathematically smoothes the data so the visuals feel "fluid" but "punchy".
 */
export function extractAudioFeatures({
  frequencyData,
  timeDomainData,
  analyser,
  previous = {},
}) {
  // Nyquist theorem: The highest frequency the analyser can detect is half the sample rate.
  const nyquist = analyser.context.sampleRate / 2;
  const binCount = frequencyData.length;
  // Calculate how many Hertz each index in the array actually covers.
  const hzPerBin = nyquist / binCount;

  // Helper to convert human Hz targets into array indices.
  const binForHz = (hz) => Math.floor(hz / hzPerBin);

  // FREQUENCY SPLITTING (FFT Analysis)
  // Divide the sound into Bass (kick drums, deep synth), Mids (vocals, guitars), Highs (cymbals, air).
  // Visual Impact: Allows different parts of the visual scene to react to different instruments.
  // E.g., Particles flutter on highs, Nodes pump on bass.
  const bassRaw =
    averageRange(frequencyData, binForHz(20), binForHz(140)) / 255;

  const midsRaw =
    averageRange(frequencyData, binForHz(140), binForHz(2000)) / 255;

  const highsRaw =
    averageRange(frequencyData, binForHz(2000), binForHz(8000)) / 255;

  // RMS CALCULATION (Root Mean Square) for Overall Volume
  // WHY: RMS accurately reflects "perceived loudness" better than just checking peak amplitude.
  let rms = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    // 128 is silence in 8-bit time domain data. Normalize around 0.
    const normalized = (timeDomainData[i] - 128) / 128;
    rms += normalized * normalized;
  }
  rms = Math.sqrt(rms / timeDomainData.length);

  // Boost the volume response so the visuals don't feel dead when the music is quiet.
  const levelRaw = clamp01(rms * 2.5);

  // ⚠️ VERY SENSITIVE: SOFTWARE RECTIFYING / SMOOTHING
  // This value determines how much of the PREVIOUS frame's envelope is carried over.
  // Higher = slow, sluggish visuals. Lower = violently twitching visuals. 
  // 0.12 perfectly trails the transients so lights fade naturally smoothly.
  const smoothing = 0.12;

  const bass =
    previous.bass != null
      ? previous.bass + (bassRaw - previous.bass) * smoothing
      : bassRaw;

  const mids =
    previous.mids != null
      ? previous.mids + (midsRaw - previous.mids) * smoothing
      : midsRaw;

  const highs =
    previous.highs != null
      ? previous.highs + (highsRaw - previous.highs) * smoothing
      : highsRaw;

  const level =
    previous.level != null
      ? previous.level + (levelRaw - previous.level) * smoothing
      : levelRaw;

  // Secondary heavy smoothed level.
  // WHY: This is used as a baseline to detect *sudden drops or spikes* (Peaks).
  const smoothedLevel =
    previous.smoothedLevel != null
      ? previous.smoothedLevel + (level - previous.smoothedLevel) * 0.08
      : level;

  // PEAK DETECTION (Transients / Snare hits)
  // Compares the immediate `level` against the sluggish `smoothedLevel`. 
  // If the immediate sound suddenly jumps far above the average, it's a transient attack.
  // Visual Impact: Used to inject sudden energy flashes into nodes/webs when a beat drops.
  const peak = Math.max(0, level - (previous.smoothedLevel ?? level));

  return {
    bass: clamp01(bass),
    mids: clamp01(mids),
    highs: clamp01(highs),
    level: clamp01(level),
    smoothedLevel: clamp01(smoothedLevel),
    // Multiply peak to make transients visibly punchier.
    peak: clamp01(peak * 3.0), 
  };
}
