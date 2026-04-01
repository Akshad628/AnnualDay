/*
 * FILE: src/audio/audioInput.js
 * SYSTEM: Audio Input
 * RESPONSIBILITY: Mounts the Web Audio API, requests microphone access (favoring professional audio interfaces like Focusrite), and sets up the AnalyserNode for Frequency and Time Domain extraction.
 * INTERACTION: Called by main.js during initialization. Passes raw frequency/time byte arrays to `audioFeatures.js` on every frame.
 * VISUAL RESULT: It does not render anything directly, but it ensures that the raw audio signal is piped into the visual system without causing local microphone feedback.
 */

import { extractAudioFeatures } from "./audioFeatures.js";

export class AudioInput {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.gainNode = null;

    this.audioElement = null;

    this.frequencyData = null;
    this.timeDomainData = null;

    // The current extracted features, used globally to drive visuals
    this.features = {
      bass: 0,
      mids: 0,
      highs: 0,
      level: 0,
      smoothedLevel: 0,
      peak: 0,
    };

    this.isReady = false;
    this.isPlaying = false;
    this.mode = null; // "file" later "live"
  }

  /**
   * Automatically requests microphone access, preferring professional "Focusrite" interfaces.
   * WHY: Laptops often default to their built-in crappy mic instead of a mixer output. 
   * A clean audio feed is CRITICAL so the visuals don't respond to room noise, only the pure mix.
   */
  async initFromMicrophone() {
    this.mode = "live";
    // Initialize Web Audio API. 
    this.audioContext = new window.AudioContext();

    try {
      // STEP 1 — First pass (NO permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === "audioinput");

      let targetDevice = audioDevices.find(d => {
        return d.label.toLowerCase().includes("focusrite");
      });

      // STEP 2 — If NOT found → request permission (labels only fully appear after permission)
      if (!targetDevice) {
        console.warn("Focusrite not found (pre-permission). Requesting access...");

        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devicesAfter = await navigator.mediaDevices.enumerateDevices();
        const audioDevicesAfter = devicesAfter.filter(d => d.kind === "audioinput");

        targetDevice = audioDevicesAfter.find(d => {
          const label = d.label.toLowerCase();
          return (
            label.includes("focusrite") &&
            label.includes("analogue")
          );
        });
      }

      // STEP 3 — Apply constraints
      // WHY THESE ARE FALSE: Built-in browser audio processing DESTROYS the dynamics 
      // of live music by trying to cancel echoes or boost quiet sounds (AGC). 
      // We want the RAW, unaltered waveform.
      const constraints = {
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      };

      if (targetDevice) {
        console.log("✅ Using Focusrite:", targetDevice.label);
        constraints.audio.deviceId = { exact: targetDevice.deviceId };
      } else {
        console.warn("⚠️ Focusrite NOT found. Using default.");
        console.warn("Focusrite interface not detected. Using default microphone.");
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create proper routing nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Setup the Analyser
      this.analyser = this.audioContext.createAnalyser();
      
      // PERFORMANCE NOTE: FFT size dictates the resolution of the frequency bands. 
      // 2048 is a good balance between low-end resolution and CPU performance.
      // Higher = better bass detection, but slower. Lower = chunky frequency bands.
      this.analyser.fftSize = 2048;
      
      // Hardware-level smoothing on the analyser.
      this.analyser.smoothingTimeConstant = 0.75;

      this.sourceNode.connect(this.analyser);
      
      // ⚠️ IMPORTANT SIDE EFFECT AVOIDANCE: 
      // We do NOT connect the analyser to `audioContext.destination`. 
      // If we did, the microphone input would come out of the speakers, causing infinite feedback howl.

      // Pre-allocate typed arrays to prevent Garbage Collection (GC) spikes on every frame.
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.fftSize);

      this.isReady = true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }

  /**
   * Resumes the audio context if the browser suspended it (requires user interaction).
   */
  async resumeAndPlay() {
    if (!this.isReady) return;

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    this.isPlaying = true;
  }

  pause() {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.isPlaying = false;
  }

  togglePlayPause() {
    if (!this.audioElement) return;

    if (this.audioElement.paused) {
      this.resumeAndPlay();
    } else {
      this.pause();
    }
  }

  /**
   * Called every frame by main.js. Pulls raw byte data and pipes it into the feature extractor.
   * @returns {Object} Extracted features map {bass, mids, highs, level, peak}
   */
  update() {
    if (!this.isReady || !this.analyser) return this.features;

    // Fill our pre-allocated arrays
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Pass arrays to the mathematical extractor
    this.features = extractAudioFeatures({
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      analyser: this.analyser,
      previous: this.features, // Pass previous frame to calculate smoothing/diffs
    });

    return this.features;
  }

  getFeatures() {
    return this.features;
  }
}
