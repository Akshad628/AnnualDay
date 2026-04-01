# Project Codebase

## index.html

```html
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You Are the World</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background-color: #05070a;
      color: white;
      font-family: sans-serif;
    }

    #app {
      width: 100vw;
      height: 100vh;
    }

    #ui-layer {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
      pointer-events: none;
    }

    .instructions {
      font-size: 14px;
      opacity: 0.7;
      margin-bottom: 10px;
    }

    #status {
      font-weight: bold;
      color: #f4e6a2;
    }

    video {
      display: none;
    }

    video {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
  </style>
</head>

<body>
  <div id="ui-layer" style="display: none;">
    <div class="instructions">
      Press 'C' to calibrate stage width based on current singer positions.<br>
      Currently tracking: <span id="status">Waiting for camera...</span>
    </div>
  </div>
  <div id="start-overlay"
    style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: #111111; color: #e6e6e6; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; cursor: pointer; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px; transition: opacity 1s ease-out;">
    <div id="intro-text-container"
      style="text-align: center; display: flex; flex-direction: column; align-items: center;"></div>

    <div id="init-instruction" style="display: none;"></div>
    <div id="start-instruction" style="display: none;"></div>
  </div>

  <style>
    @keyframes blink-caret {

      from,
      to {
        border-color: transparent
      }

      50% {
        border-color: rgba(255, 165, 0, 0.8);
      }
    }

    #init-instruction.pulse-active {
      animation: pulse 2s infinite;
      opacity: 1;
    }

    @keyframes pulse {
      0% {
        opacity: 0.5;
      }

      50% {
        opacity: 1;
      }

      100% {
        opacity: 0.5;
      }
    }
  </style>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const lines = [
        { text: "AR/VR Research Lab, GCET presents", size: "2.25vw", color: "#a0a0a0", margin: "3vw" },
        { text: "YOU ARE THE WORLD", size: "5.25vw", color: "#e6e6e6", margin: "3vw", spacing: "0.3vw" },
        { text: "An Interactive Audiovisual Performance", size: "2.25vw", color: "#cccccc", margin: "4.5vw" },
        { text: "Krishna Priya · Akshad · Ananya", size: "2.25vw", color: "#cccccc", margin: "0.75vw" },
        { text: "with AI collaborators", size: "1.8vw", color: "#cccccc", margin: "0.75vw" },
        { text: "ChatGPT · Gemini · Claude", size: "2.25vw", color: "#cccccc", margin: "0vw" }
      ];

      const container = document.getElementById('intro-text-container');
      let currentLineIndex = 0;

      function typeLine() {
        if (currentLineIndex >= lines.length) {
          const initEl = document.getElementById('init-instruction');
          initEl.classList.add('pulse-active');
          return;
        }

        const lineData = lines[currentLineIndex];
        const lineEl = document.createElement('div');
        lineEl.style.fontSize = lineData.size;
        lineEl.style.color = lineData.color;
        lineEl.style.marginBottom = lineData.margin;
        if (lineData.spacing) lineEl.style.letterSpacing = lineData.spacing;
        lineEl.style.minHeight = lineData.size; // preserve height

        lineEl.innerHTML = `<span class="typed-text"></span><span class="caret" style="display: inline-block; border-right: 0.15em solid rgba(255, 165, 0, 0.8); animation: blink-caret .75s step-end infinite; width: 0.05em; height: 1em; vertical-align: bottom; margin-left: 2px;"></span>`;
        container.appendChild(lineEl);

        const textSpan = lineEl.querySelector('.typed-text');
        const caretSpan = lineEl.querySelector('.caret');
        let charIndex = 0;

        function typeChar() {
          if (charIndex < lineData.text.length) {
            textSpan.textContent += lineData.text.charAt(charIndex);
            charIndex++;
            // NEW: Slower typing speed (was 30 + rand(30))
            setTimeout(typeChar, 60 + Math.random() * 40);
          } else {
            caretSpan.style.display = 'none';
            currentLineIndex++;
            setTimeout(typeLine, 300); // Slightly longer pause between lines
          }
        }
        typeChar();
      }

      setTimeout(typeLine, 500); // Small initial delay
    });
  </script>
  <div id="admin-panel" style="display: none;">
    <button id="admin-toggle"
      style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 10px; cursor: pointer; border-radius: 4px; opacity: 0.2; transition: opacity 0.3s;">⚙️
      VJ Controls</button>
    <div id="admin-controls"
      style="display: none; background: rgba(0,0,0,0.8); border: 1px solid #444; padding: 15px; border-radius: 8px; flex-direction: column; gap: 10px;">
      <button id="btn-calibrate"
        style="padding: 8px 16px; background: #333; color: white; border: 1px solid #555; cursor: pointer;">Calibrate
        Stage (C)</button>
      <button id="btn-force-finale"
        style="padding: 8px 16px; background: #522; color: white; border: 1px solid #733; cursor: pointer;">Force Finale
        (F)</button>
    </div>
  </div>
  
  <!-- Finale and Credits Layer (Left Aligned Pane) -->
  <div id="finale-layer" style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.3); display: none; flex-direction: column; z-index: 150; font-family: 'Courier New', Courier, monospace; pointer-events: none; transition: opacity 2s;">
    
    <style>
      #credits {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 2.2rem;
        line-height: 1.6;
        letter-spacing: 2px;
        width: 80%;
        max-width: 900px;
        overflow: hidden;
        height: 100%;
      }
      #credits .scroll-wrapper {
        position: absolute;
        width: 100%;
        bottom: -200%;
        animation: scroll-up 48s linear forwards;
      }
      @keyframes scroll-up {
        0% { transform: translateY(0); }
        100% { transform: translateY(-400%); }
      }
      h1.title {
        font-size: 2.8rem;
        color: #fff;
        letter-spacing: 0.4rem;
        margin-bottom: 60px;
        text-transform: uppercase;
        border-bottom: 2px solid rgba(255,255,255,0.2);
        display: inline-block;
        padding-bottom: 10px;
      }
      .credit-entry { margin-bottom: 35px; line-height: 1.5; }
      .name { font-size: 1.6rem; font-weight: bold; display: block; color: #ffffff; text-transform: uppercase; }
      .role { font-size: 1.1rem; color: #aaa; display: block; margin-top: 4px; }
      .group-title { font-style: italic; color: orange; font-size: 0.95rem; margin-top: 3px; display: block; }
    </style>

    <div id="credits" class="credits-container" style="opacity: 0; transition: opacity 2s;">
      <div class="scroll-wrapper">
        <h1 class="title">Human Collaborators</h1>
        <div class="credit-entry"><span class="name">Krishna Priya</span><span class="role">Vocalist, Concept Artist</span><span class="group-title">AR/VR Research Lab</span></div>
        <div class="credit-entry"><span class="name">Akshad Mishra</span><span class="role">Programmer, Technical Support</span><span class="group-title">AR/VR Research Lab</span></div>
        <div class="credit-entry"><span class="name">Ananya Pulla</span><span class="role">Programmer, Vocalist</span><span class="group-title">AR/VR Research Lab, Maya</span></div>
        <div class="credit-entry"><span class="name">Satwik</span><span class="role">Vocalist</span><span class="group-title">Maya</span></div>
        <div class="credit-entry"><span class="name">Prateek</span><span class="role">Special Effects, Pianist</span><span class="group-title">Maya</span></div>
        <div class="credit-entry"><span class="name">Aman</span><span class="role">Guitarist</span><span class="group-title">Kingfishers</span></div>
        <div class="credit-entry"><span class="name">Surya</span><span class="role">Drummer</span><span class="group-title">Kingfishers</span></div>
        <div style="height: 300px;"></div>
      </div>
    </div>
  </div>
  <video id="webcam" autoplay playsinline></video>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>

</html>
```

## src/audio/audioFeatures.js

```javascript
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

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

export function extractAudioFeatures({
  frequencyData,
  timeDomainData,
  analyser,
  previous = {},
}) {
  const nyquist = analyser.context.sampleRate / 2;
  const binCount = frequencyData.length;
  const hzPerBin = nyquist / binCount;

  const binForHz = (hz) => Math.floor(hz / hzPerBin);

  const bassRaw =
    averageRange(frequencyData, binForHz(20), binForHz(140)) / 255;

  const midsRaw =
    averageRange(frequencyData, binForHz(140), binForHz(2000)) / 255;

  const highsRaw =
    averageRange(frequencyData, binForHz(2000), binForHz(8000)) / 255;

  let rms = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    const normalized = (timeDomainData[i] - 128) / 128;
    rms += normalized * normalized;
  }
  rms = Math.sqrt(rms / timeDomainData.length);

  const levelRaw = clamp01(rms * 2.5);

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

  const smoothedLevel =
    previous.smoothedLevel != null
      ? previous.smoothedLevel + (level - previous.smoothedLevel) * 0.08
      : level;

  const peak = Math.max(0, level - (previous.smoothedLevel ?? level));

  return {
    bass: clamp01(bass),
    mids: clamp01(mids),
    highs: clamp01(highs),
    level: clamp01(level),
    smoothedLevel: clamp01(smoothedLevel),
    peak: clamp01(peak * 3.0),
  };
}

```

## src/audio/audioInput.js

```javascript
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

  async initFromMicrophone() {
    this.mode = "live";
    this.audioContext = new window.AudioContext();

    try {
      // STEP 1 — First pass (NO permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === "audioinput");

      let targetDevice = audioDevices.find(d => {
        return d.label.toLowerCase().includes("focusrite");
      });

      // STEP 2 — If NOT found → request permission
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

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.75;

      this.sourceNode.connect(this.analyser);
      // We do not connect the analyser to audioContext.destination 
      // otherwise there will be a feedback loop playing the mic input through speakers.

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.fftSize);

      this.isReady = true;
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }

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

  update() {
    if (!this.isReady || !this.analyser) return this.features;

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    this.features = extractAudioFeatures({
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      analyser: this.analyser,
      previous: this.features,
    });

    return this.features;
  }

  getFeatures() {
    return this.features;
  }
}

```

## src/camera.js

```javascript
export class CameraManager {
    constructor() {
        // Create a hidden video element to hold the stream
        this.videoElement = document.createElement("video");
        this.videoElement.style.display = "none";
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        document.body.appendChild(this.videoElement);
        this.stream = null;
    }

    async initialize() {
        try {
            // Enumerate devices to find the specific webcam
            // STEP 1 — First pass (NO permission)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            // Try label-based detection (may fail if labels are empty)
            let targetDevice = videoDevices.find(d => {
                return d.label.toLowerCase().includes("owl");
            });

            // STEP 2 — If NOT found → request permission
            if (!targetDevice) {
                console.warn("Owl camera not found (pre-permission). Requesting access...");

                await navigator.mediaDevices.getUserMedia({ video: true });

                const devicesAfter = await navigator.mediaDevices.enumerateDevices();
                const videoDevicesAfter = devicesAfter.filter(d => d.kind === "videoinput");

                targetDevice = videoDevicesAfter.find(d => {
                    const label = d.label.toLowerCase();
                    return (
                        label.includes("owl") &&
                        label.includes("4k") &&
                        label.includes("pro")
                    );
                });
            }

            // STEP 3 — Apply constraints
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                }
            };

            if (targetDevice) {
                console.log("✅ Using Owl Camera:", targetDevice.label);
                constraints.video.deviceId = { exact: targetDevice.deviceId };
            } else {
                console.warn("⚠️ Owl camera NOT found. Using default.");
                console.warn("Owl camera not detected. Using default camera.");
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.videoElement.srcObject = this.stream;

            // Wait for the video feed to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => resolve();
            });

            await this.videoElement.play();

            // Attempt to turn off autofocus
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();

            // Check if the browser and camera allow manual focus control
            if (capabilities.focusMode && capabilities.focusMode.includes("manual")) {
                await track.applyConstraints({
                    advanced: [{ focusMode: "manual" }]
                });
                console.log("Success: Autofocus disabled.");
            } else {
                console.warn("Manual focus control is not supported by this browser/camera combination.");
            }

            console.log("Camera initialized successfully.");
            return this.videoElement;

        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    }

    getVideoElement() {
        return this.videoElement;
    }
}
```

## src/controls/mouseController.js

```javascript
import * as THREE from "three";

export class MouseController {
  constructor(camera) {
    this.camera = camera;

    this.mouseNDC = new THREE.Vector2(0, 0);
    this.targetWorld = new THREE.Vector3(0, 0, 0);

    window.addEventListener("mousemove", (event) => {
      this.mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouseNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
  }

  update() {
    this.targetWorld.set(this.mouseNDC.x, this.mouseNDC.y, 0);
    this.targetWorld.unproject(this.camera);
    this.targetWorld.z = 0;

    return this.targetWorld;
  }
}

```

## src/core/tracker.js

```javascript
import { CONFIG } from '../utils/config.js';

export class PoseTracker {
    constructor(videoElement = null) {
        this.video = videoElement || document.getElementById("webcam");
        this.poseLandmarker = null;
        this.isReady = false;
        this.lastVideoTime = -1;

        this.singers = [];
        for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
            this.singers.push({
                active: false,
                ghost: false,
                lostFrames: 0,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                targetX: 0,
                targetY: 0,
                scale: 1.0,
                targetScale: 1.0,
                vScale: 0,
                // NEW: We need an initial sorting position before tracking starts
                defaultSortPosition: (i + 1) / (CONFIG.tracking.maxSingers + 1)
            });
            // Pre-position them left-to-right so the first detection snaps to the right person
            this.singers[i].x = this.singers[i].defaultSortPosition;
            this.singers[i].targetX = this.singers[i].defaultSortPosition;
        }

        this.calibration = { minX: 0.1, maxX: 0.9, active: false };
        this.setupCalibrationListener();
    }

    async initialize(externalVideoElement = null) {
        if (externalVideoElement) {
            this.video = externalVideoElement;
        }
        await this.setupMediaPipe();
        this.isReady = true;
        document.getElementById("status").innerText = "Tracking Active";
        document.getElementById("status").style.color = "#00ff00";
    }


    async setupMediaPipe() {
        try {
            const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs');
            const { FilesetResolver, PoseLandmarker } = vision;
            const visionFileset = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            this.poseLandmarker = await PoseLandmarker.createFromOptions(visionFileset, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: CONFIG.tracking.maxSingers,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
        } catch (error) {
            console.error("MediaPipe Error:", error);
        }
    }

    setupCalibrationListener() {
        window.addEventListener("keydown", (e) => {
            if (e.key === "c" || e.key === "C") this.calibrateStage();
        });
    }

    calibrateStage() {
        const activeXs = this.singers.filter(s => s.active).map(s => s.targetX);
        if (activeXs.length > 0) {
            this.calibration.minX = Math.min(...activeXs);
            this.calibration.maxX = Math.max(...activeXs);

            // SAFEGUARD: If singers are standing too close together, force the stage wider
            const spread = this.calibration.maxX - this.calibration.minX;
            if (spread < 0.6) {
                const center = (this.calibration.minX + this.calibration.maxX) / 2;
                this.calibration.minX = center - 0.3;
                this.calibration.maxX = center + 0.3;
            }

            this.calibration.active = true;

            const uiStatus = document.getElementById("status");
            const oldText = uiStatus.innerText;
            uiStatus.innerText = "CALIBRATED!";
            uiStatus.style.color = "#ffff00";
            setTimeout(() => { uiStatus.innerText = oldText; uiStatus.style.color = "#00ff00"; }, 2000);
        }
    }

    update() {
        if (!this.isReady || !this.poseLandmarker || !this.video || this.video.readyState < 2) return;
        if (this.lastVideoTime === this.video.currentTime) return;
        this.lastVideoTime = this.video.currentTime;

        const results = this.poseLandmarker.detectForVideo(this.video, performance.now());

        // UI Update
        const statusEl = document.getElementById("status");
        if (results.landmarks && results.landmarks.length > 0) {
            statusEl.innerText = `Tracking ${results.landmarks.length} person(s)`;
            statusEl.style.color = "#00ff00";
        } else {
            statusEl.innerText = "No one detected in frame";
            statusEl.style.color = "red";
        }

        for (let s of this.singers) s.activeThisFrame = false;

        if (results.landmarks && results.landmarks.length > 0) {
            // SINGLE SINGER MODE: Only deal with the first detected pose
            const pose = results.landmarks[0]; 
            const singer = this.singers[0];

            if (pose[11] && pose[12]) {
                const torsoX = 1.0 - ((pose[11].x + pose[12].x) / 2); // Mirrored
                const isInZone = torsoX >= CONFIG.tracking.zoneMinX && torsoX <= CONFIG.tracking.zoneMaxX;

                if (isInZone) {
                    singer.activeThisFrame = true;
                    singer.lostFrames = 0;
                    if (!singer.active) { singer.active = true; singer.ghost = false; }

                    const leftShoulder = pose[11], rightShoulder = pose[12];
                    const leftHip = pose[23], rightHip = pose[24];
                    const leftWrist = pose[15], rightWrist = pose[16];

                    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

                    // 1. Torso as Base Position
                    let torsoY = (leftShoulder.y + rightShoulder.y) / 2;
                    if (leftHip && rightHip) {
                        torsoY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
                    }

                    // 2. Hands as Offset
                    let handX = torsoX;
                    let handY = torsoY;
                    let handCount = 0;

                    // Enforce threshold if visibility exists from MediaPipe
                    const isLeftValid = leftWrist && (leftWrist.visibility === undefined || leftWrist.visibility > 0.5);
                    const isRightValid = rightWrist && (rightWrist.visibility === undefined || rightWrist.visibility > 0.5);

                    if (isLeftValid) {
                        handX += (1.0 - leftWrist.x); // Mirrored
                        handY += leftWrist.y;
                        handCount++;
                    }
                    if (isRightValid) {
                        handX += (1.0 - rightWrist.x); // Mirrored
                        handY += rightWrist.y;
                        handCount++;
                    }

                    if (handCount > 0) {
                        handX = (handX - torsoX) / handCount + torsoX;
                        handY = (handY - torsoY) / handCount + torsoY;
                    }

                    // 3. Final Mapping (Non-Linear Boost)
                    const offsetX = handX - torsoX;
                    const boostFactor = 0.5 + Math.abs(offsetX); 
                    singer.targetX = torsoX + offsetX * boostFactor;
                    
                    // HARD CLAMP (fix right-side break + overshoot)
                    singer.targetX = Math.max(0.05, Math.min(0.95, singer.targetX));

                    // Vertical Movement: Normalize around center & Amplify
                    const centeredY = torsoY - 0.5;
                    const verticalRange = 0.25;
                    let finalY = centeredY / verticalRange;
                    finalY = Math.max(-1, Math.min(1, finalY)); // Clamp extreme jumps
                    finalY += (handY - torsoY) * 0.5; // Hand Influence

                    // Map to 3D Scene space - inverted Y
                    singer.targetY = -finalY; 
                    singer.targetY = Math.max(-1.0, Math.min(1.0, singer.targetY)); // Bounding limits

                    // 4. Deadzone (Anti-Jitter)
                    if (Math.abs(singer.targetX - singer.x) < 0.035) singer.targetX = singer.x;
                    if (Math.abs(singer.targetY - singer.y) < 0.01) singer.targetY = singer.y;

                    // 5. Scale (Restore depth trigger)
                    singer.targetScale = Math.max(1.0, Math.min(1.0 + (Math.max(0, shoulderWidth - 0.05) * 6.0), 3.0));

                    console.log({
                        rawTorsoX: torsoX,
                        targetX: singer.targetX
                    });

                } else {
                    // Out of zone - float smoothly to center
                    singer.activeThisFrame = true;
                    singer.lostFrames = 0;
                    singer.targetX = 0.5;
                    singer.targetY = 0;
                }
            }
        }

        // Handle centering if fully lost frame or drift
        for (let s of this.singers) {
            if (!s.activeThisFrame && s.active) {
                s.lostFrames++;
                if (s.lostFrames > CONFIG.tracking.maxLostFrames) {
                    s.active = false;
                    s.ghost = true;
                    s.targetX = 0.5; // Recenter when lost
                    s.targetY = 0;
                    s.targetScale = 1.0;
                }
            }

            if (s.active || s.ghost) {
                const ax = (s.targetX - s.x) * CONFIG.tracking.springTension;
                s.vx = (s.vx + ax) * CONFIG.tracking.springFriction;
                s.x += s.vx;

                const ay = (s.targetY - s.y) * CONFIG.tracking.springTension;
                s.vy = (s.vy + ay) * CONFIG.tracking.springFriction;
                s.y += s.vy;

                s.vx = Math.max(-0.02, Math.min(0.02, s.vx));
                s.vy = Math.max(-0.02, Math.min(0.02, s.vy));

                const aScale = (s.targetScale - s.scale) * CONFIG.tracking.scaleTension;
                s.vScale = (s.vScale + aScale) * CONFIG.tracking.scaleFriction;
                s.scale += s.vScale;
                s.scale = Math.max(0.8, Math.min(3.0, s.scale));
            }
        }
    }

        getMappedWorldData(singerIndex, worldWidth, worldHeight) {
            const s = this.singers[singerIndex];
            if (!s.active && !s.ghost) return { visible: false };

            let normalizedX = s.x;
            if (this.calibration.active) {
                normalizedX = (s.x - this.calibration.minX) / (this.calibration.maxX - this.calibration.minX);
            }
            normalizedX = Math.max(0, Math.min(1, normalizedX));
            
            console.log({
                calibratedX: normalizedX
            });

            const activeWidth = worldWidth - (2 * (worldWidth * CONFIG.tracking.stageMarginX));

            return {
                visible: true,
                ghost: s.ghost,
                x: (normalizedX * activeWidth) - (activeWidth / 2),
                y: s.y * (worldHeight * 0.55),
                scale: s.scale
            };
        }
    }
```

## src/main.js

```javascript
import * as THREE from 'three';
import { setupScene } from './scene/setupScene.js';
import { NodeField } from './visuals/nodes.js';
import { ParticleField } from './visuals/particleField.js';
import { CircleAgent } from './visuals/circleAgent.js';
import { AudioInput } from './audio/audioInput.js';
import { PoseTracker } from './core/tracker.js';
import { CONFIG } from './utils/config.js';
import { CameraManager } from './camera.js';

let scene, camera, renderer, nodeField, particleField, audioInput, poseTracker;
let halos = [];

const clock = new THREE.Clock();
let isRunning = false;
let isOutroActive = false;
let frozenHaloPosition = null;
let haloScaleTarget = 3.0;
let finaleHoldTimer = 0;
let performanceStarted = false;
let isCalibrated = false;
let buildTimer = 0;
let trackingEnabled = false;

// --- NEW: Text Management Variables ---
const HALO_WORDS = [
  "choice", "truth", "belief", "ethics", "thoughts", "feelings",
  "emotions", "oneness", "love", "devotion", "morals", "values"
];
let activeWords = ["", "", ""];
let wordTimers = [0, 0, 0];
// Start intervals at 0 so they get assigned a word immediately on first frame
let wordIntervals = [0, 0, 0];


function initVisuals() {
  const setup = setupScene();
  scene = setup.scene;
  camera = setup.camera;
  renderer = setup.renderer;
  nodeField = new NodeField(scene);
  particleField = new ParticleField(scene);

  for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
    const halo = new CircleAgent(scene);

    // APPLY DISTINCT COLORS HERE
    const colorHex = CONFIG.singerColors[i];
    halo.glow.material.color.setHex(colorHex);
    halo.ring.material.color.setHex(colorHex);
    // Keep the core black as requested
    halo.core.material.color.setHex(CONFIG.colors.circleCore);

    halo.group.visible = false;

    // Store default opacities so we can reset them after Ghost Mode
    halo.defaultGlowOpacity = 0.12;
    halo.defaultCoreOpacity = 0.0;
    halo.defaultRingOpacity = 0.45;
    halo.defaultTextOpacity = 0.9; // Store text opacity for ghost fading

    halos.push(halo);
  }
  renderer.render(scene, camera);
  
  // Start the background animation loop immediately so Three.js doesn't freeze
  clock.start();
  animate();
}

async function startExperience() {
  if (isRunning) return;
  isRunning = true;
  
  const initInstruction = document.getElementById('init-instruction');
  if (initInstruction) {
    initInstruction.innerText = "Initializing camera and microphone...";
    initInstruction.style.animation = "none";
  }

  // Initialize Camera
  const cameraManager = new CameraManager();
  const videoElement = await cameraManager.initialize();

  audioInput = new AudioInput();
  await audioInput.initFromMicrophone();
  await audioInput.resumeAndPlay();

  poseTracker = new PoseTracker();
  await poseTracker.initialize(videoElement);
  
  if (initInstruction) initInstruction.style.display = 'none';
  const startInstruction = document.getElementById('start-instruction');
  if (startInstruction) startInstruction.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  initVisuals();
  document.getElementById('start-overlay').addEventListener('click', startExperience);

  // VJ Controls Setup
  const adminToggle = document.getElementById('admin-toggle');
  const adminControls = document.getElementById('admin-controls');

  adminToggle.addEventListener('mouseenter', () => adminToggle.style.opacity = '1');
  adminToggle.addEventListener('mouseleave', () => {
    if (adminControls.style.display === 'none') adminToggle.style.opacity = '0.2';
  });

  adminToggle.addEventListener('click', () => {
    adminControls.style.display = adminControls.style.display === 'none' ? 'flex' : 'none';
  });

  document.getElementById('btn-calibrate').addEventListener('click', () => {
    if (poseTracker) poseTracker.calibrateStage();
  });

  document.getElementById('btn-force-finale').addEventListener('click', triggerManualFinale);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      if (poseTracker) {
        poseTracker.calibrateStage();

        if (!isCalibrated) {
            isCalibrated = true;
            buildTimer = 0;
        }

        if (!performanceStarted) {
          performanceStarted = true;
          const overlay = document.getElementById('start-overlay');
          if (overlay) {
             overlay.style.opacity = '0';
             setTimeout(() => overlay.style.display = 'none', 1000);
          }
        }
      }
    }
    if (e.key === 'f' || e.key === 'F') triggerManualFinale();
  });
});

function triggerManualFinale() {
  if (isOutroActive) return;
  const halo = halos[0];
  if (!halo || !halo.group) return;

  isOutroActive = true;

  if (!isFinite(halo.group.scale.x)) {
    halo.group.scale.setScalar(1.0);
  }

  // Freeze position
  frozenHaloPosition = halo.currentPosition.clone();

  // Hide other halos
  halos.forEach((h, i) => {
    if (i !== 0) h.group.visible = false;
  });

  haloScaleTarget = halo.group.scale.x * 1.4;
  haloScaleTarget = Math.min(haloScaleTarget, 6.0);

  // Set final text
  halo.setWord("YOU ARE\nTHE WORLD");
  halo.lockScale = true;

  // Ensure visible
  halo.group.visible = true;
  halo.textSprite.material.opacity = 1.0;

  // Trigger credits
  const finaleLayer = document.getElementById('finale-layer');
  const credits = document.getElementById('credits');

  if (finaleLayer) finaleLayer.style.display = 'flex';

  setTimeout(() => {
    if (credits) {
      credits.style.opacity = 1;
      const scrollWrapper = credits.querySelector('.scroll-wrapper');
      if (scrollWrapper) {
        scrollWrapper.style.animation = 'scroll-up 48s linear forwards';
      }
    }
  }, 800);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  if (isOutroActive) {
    const halo = halos[0];

    // Lock position
    halo.update(frozenHaloPosition, elapsedTime);

    const currentScale = halo.group.scale.x;

    // Prevent NaN or broken scale
    if (!isFinite(currentScale) || currentScale <= 0) {
      halo.group.scale.setScalar(1.0);
    }

    const newScale = currentScale + (haloScaleTarget - currentScale) * 0.05;
    halo.group.scale.setScalar(newScale);



    renderer.render(scene, camera);
    return;
  }

  if (isCalibrated) {
      buildTimer += delta;
  }
  window.isCalibrated = isCalibrated;

  if (poseTracker) poseTracker.update();
  
  // Provide default quiet features if audioInput isn't ready
  const audioFeatures = audioInput ? audioInput.update() : { volume: 0, highFreq: 0, lowFreq: 0 };

  if (!isOutroActive) {
    let activeHalos = 0;
    let combinedPosition = new THREE.Vector3();

    // Calculate dynamic world width based on aspect ratio
    const aspect = window.innerWidth / window.innerHeight;
    const dynamicWorldWidth = CONFIG.world.height * aspect;

    for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
      const halo = halos[i];
      
      // BEFORE CALIBRATION → NO HALO
      if (!isCalibrated) {
        halo.group.visible = false;
        continue;
      }

      // BUILD PHASE (0–15s) → NO HALO
      if (buildTimer < 15) {
        halo.group.visible = false;
        continue;
      }

      // AFTER 15s → ENABLE TRACKING
      trackingEnabled = true;
      
      const trackedData = poseTracker.getMappedWorldData(i, dynamicWorldWidth, CONFIG.world.height);

      if (trackedData && trackedData.visible) {
        halo.group.visible = true;
        const targetWorld = new THREE.Vector3(trackedData.x, trackedData.y, 0);
        halo.group.scale.setScalar(trackedData.scale);

        // Let CircleAgent do its base visual updates (this updates the pulsing logic)
        halo.update(targetWorld, elapsedTime);


        // --- NEW: Word Cycling Logic ---
        wordTimers[i] += delta;
        if (wordTimers[i] > wordIntervals[i]) {
          wordTimers[i] = 0;
          // Next change in 3 to 5 seconds
          wordIntervals[i] = 3 + Math.random() * 2;

          // Get all words that are NOT currently being displayed on ANY circle
          const availableWords = HALO_WORDS.filter(w => !activeWords.includes(w));

          // Pick a random word from the remaining pool
          const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];

          activeWords[i] = newWord;
          halo.setWord(newWord);
        }
        // -------------------------------
        // Manage Ghost Fade-out overrides
        if (trackedData.ghost) {
          halo.ghostOpacity = (halo.ghostOpacity ?? 1.0) - (delta * 0.4);
          if (halo.ghostOpacity <= 0) {
            halo.group.visible = false;
            poseTracker.singers[i].ghost = false;
          } else {
            // Apply ghost fade relative to the default opacity
            halo.core.material.opacity = halo.defaultCoreOpacity * halo.ghostOpacity;
            halo.glow.material.opacity = halo.defaultGlowOpacity * halo.ghostOpacity;
            halo.ring.material.opacity = halo.defaultRingOpacity * halo.ghostOpacity;
            halo.textSprite.material.opacity = halo.defaultTextOpacity * halo.ghostOpacity; // Fade text with ghost
          }
        } else {
          // BUG FIX: Fully reset opacities when active again
          halo.ghostOpacity = 0.0;
          halo.textSprite.material.opacity = halo.defaultTextOpacity; // Reset text opacity
          // We don't need to manually set opacity here because halo.update() handles the natural pulsing

          activeHalos++;
          combinedPosition.add(halo.currentPosition);

          const scaledRadius = CONFIG.circle.radius * trackedData.scale * 1.8;
          nodeField.interactWithCircle(halo.currentPosition, scaledRadius, elapsedTime);
        }
      } else {
        halo.group.visible = false;
        // Ensure it's ready to be fully opaque next time it appears
        halo.ghostOpacity = 1.0;
      }
    }

    // Auto-Finale logic 
    finaleHoldTimer = 0;
  }

  nodeField.update(delta, elapsedTime, audioFeatures);
  particleField.update(elapsedTime, audioFeatures);
  renderer.render(scene, camera);
}
```

## src/scene/setupScene.js

```javascript
import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.backgroundColor);

  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = CONFIG.world.height;
  const frustumWidth = frustumHeight * aspect;

  const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2,
    frustumWidth / 2,
    frustumHeight / 2,
    -frustumHeight / 2,
    0.1,
    1000,
  );

  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  const app = document.getElementById("app");
  app.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = CONFIG.world.height;
    const frustumWidth = frustumHeight * aspect;

    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
  });

  return { scene, camera, renderer };
}

```

## src/style.css

```css
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: black;
}

canvas {
  display: block;
}

```

## src/utils/config.js

```javascript
export const CONFIG = {
  backgroundColor: 0x05070a,

  world: {
    width: 160,
    height: 90,
  },

  nodes: {
    count: 130,
    baseRadius: 0.28,
    revealSpeed: 0.03,
    lineDistance: 15,
    driftAmount: 0.8,
    lineOpacity: 0.1,

    touchRadiusBoost: 1.5,
    touchCooldown: 0.35,
    pulseDecaySpeed: 2.0,
    localRevealRadius: 16,
  },

  colors: {
    node: 0xf4e6a2,
    nodeBright: 0xfff3c2,
    nodeTouched: 0xfff0b8,
    line: 0xf0df9a,
    circleCore: 0x0a0b10,
    circleGlow: 0xf6e7a8,
    particleGold: 0xf0dfa8,
    particleBlue: 0x5b73b3,
    hazeBlue: 0x09101f,
  },

  circle: {
    radius: 7,
    glowRadius: 9.5,
    followLerp: 0.08,
  },

  // NEW: Tracking Configuration
  tracking: {
    maxSingers: 1, // Changed to Single Singer Mode
    smoothing: 0.25, 
    maxLostFrames: 90, 
    stageMarginX: 0.1, 
    verticalDeadzone: 0.05, 
    verticalMultiplier: 0.6, 
    horizontalMultiplier: 0.6, 

    // Zone Thresholds (0.0 to 1.0 of camera view)
    zoneMinX: 0.2,
    zoneMaxX: 0.8,

    springTension: 0.07, 
    springFriction: 0.85, 
    scaleTension: 0.08,
    scaleFriction: 0.85,
    identityThreshold: 0.25
  },

  // NEW: Finale Configuration
  finale: {
    mergeDistance: 15.0, // Distance threshold for all 3 halos to be considered 'together'
    holdTime: 3.0 // Seconds they must hold the position before finale triggers
  },

  // Add this inside src/utils/config.js

  singerColors: [
    0xf6e7a8, // Singer 1: Gold/Yellow (Default)
    0xa8f6e7, // Singer 2: Cyan/Teal
    0xe7a8f6  // Singer 3: Purple/Pink
  ],

  organic: {
    membraneOpacity: 0.18,
    nucleusOpacity: 0.85,
    veinOpacity: 0.35,
    filamentOpacity: 0.45,

    membraneScale: 3.2,
    veinCount: 6,
    filamentCount: 5,

    wobble: 0.35,
  },

  connectors: {
    curveStrength: 0.18,
    subdivisions: 20,
  },
  particles: {
    count: 80,
    baseSize: 18,
    driftAmount: 0.18,
    opacity: 0.08,
    audioOpacityBoost: 0.05,
    audioSizeBoost: 0.1,
  },
  dust: {
    count: 140,
    baseSize: 1,
    opacity: 0.06,
    driftAmount: 0.08,
  },
};
```

## src/visuals/circleAgent.js

```javascript
import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

export class CircleAgent {
  constructor(scene) {
    this.scene = scene;

    this.group = new THREE.Group();

    const glowGeometry = new THREE.CircleGeometry(CONFIG.circle.glowRadius, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.circleGlow,
      transparent: true,
      opacity: 0.12,
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);

    const coreGeometry = new THREE.CircleGeometry(CONFIG.circle.radius, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.circleCore,
      transparent: true,
      opacity: 0.96,
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);

    const ringGeometry = new THREE.RingGeometry(
      CONFIG.circle.radius + 0.25,
      CONFIG.circle.radius + 0.7,
      64,
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.circleGlow,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);

    // --- NEW: Text Canvas & Sprite ---
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 1024;
    this.textCanvas.height = 512;
    this.textCtx = this.textCanvas.getContext('2d');
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);

    const textMaterial = new THREE.SpriteMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0.9,
    });
    this.textSprite = new THREE.Sprite(textMaterial);

    // Scale the text relative to the halo
    this.textSprite.scale.set(10, 5, 1);
    this.textSprite.position.set(0, 0, 3); // Place it in front of the core
    this.textSprite.center.set(0.5, 0.5);

    this.group.add(this.glow);
    this.group.add(this.core);
    this.group.add(this.ring);
    this.group.add(this.textSprite); // Add text to the group

    // --- NEW: Default Opacities to prevent ghost overrides crashing with undefined ---
    this.defaultTextOpacity = 0.9;
    this.defaultCoreOpacity = 0.96;
    this.defaultGlowOpacity = 0.12;
    this.defaultRingOpacity = 0.45;

    this.group.position.set(0, 0, 2);

    this.currentPosition = new THREE.Vector3(0, 0, 2);
    this.targetPosition = new THREE.Vector3(0, 0, 2);
    this.appearProgress = 0;
    this.lockScale = false;

    this.scene.add(this.group);
  }

  // NEW METHOD: Draws the text onto the texture
  setWord(word) {
    const ctx = this.textCtx;
    const width = this.textCanvas.width;
    const height = this.textCanvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!word) {
      this.textTexture.needsUpdate = true;
      return;
    }

    const lines = word.toUpperCase().split("\n");

    let fontSize = 140; // BIG font, not sprite scale

    do {
      ctx.font = `900 ${fontSize}px Arial Black, Impact, sans-serif`;

      const widest = Math.max(...lines.map(l => ctx.measureText(l).width));

      if (widest <= this.textCanvas.width * 0.75) break;

      fontSize -= 4;

    } while (fontSize > 40);

    // STYLE (THICK + GLOW)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Strong glow
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 18;

    // Stroke for thickness
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";

    const lineHeight = fontSize * 1.1;
    const totalHeight = lines.length * lineHeight;

    lines.forEach((line, i) => {
      const y = this.textCanvas.height / 2 - totalHeight / 2 + i * lineHeight + lineHeight / 2;

      ctx.strokeText(line, this.textCanvas.width / 2, y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, this.textCanvas.width / 2, y);
    });

    this.textTexture.needsUpdate = true;
  }

  update(targetWorld, elapsedTime) {
    this.targetPosition.set(targetWorld.x, targetWorld.y, 2);

    this.currentPosition.lerp(this.targetPosition, CONFIG.circle.followLerp);
    this.group.position.copy(this.currentPosition);

    if (this.appearProgress < 1) {
        this.appearProgress += 0.03;
    }
    const visualScale = this.appearProgress;

    const pulse = 1 + Math.sin(elapsedTime * 1.6) * 0.02;
    this.glow.scale.setScalar(pulse);

    const baseRingOpacity = 0.38 + Math.sin(elapsedTime * 2.2) * 0.07;
    const baseGlowOpacity = 0.1 + Math.sin(elapsedTime * 1.4) * 0.025;

    // ONLY affects opacity (fade-in), NOT size
    this.ring.material.opacity = baseRingOpacity * visualScale;
    this.glow.material.opacity = baseGlowOpacity * visualScale;
    this.core.material.opacity = (this.defaultCoreOpacity || 0.96) * visualScale;
}}

```

## src/visuals/nodes.js

```javascript
import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class NodeField {
  constructor(scene) {
    this.scene = scene;

    this.nodes = [];
    this.visibleNodeCount = 0;
    this.revealProgress = 0;
    this.activationProgress = 0;

    this.audio = {
      bass: 0,
      mids: 0,
      highs: 0,
      level: 0,
      peak: 0,
    };

    this.nodeGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.organicGroup = new THREE.Group();

    this.linePool = []; // NEW: Array to hold pre-instantiated lines to prevent GC thrashing

    this.scene.add(this.lineGroup);
    this.scene.add(this.organicGroup);
    this.scene.add(this.nodeGroup);

    this.createNodes();
  }

  createNodes() {
    for (let i = 0; i < CONFIG.nodes.count; i++) {
      const baseRadius = CONFIG.nodes.baseRadius * randomRange(0.8, 1.8);

      const geometry = new THREE.CircleGeometry(baseRadius, 24);
      const baseColor =
        Math.random() > 0.82 ? CONFIG.colors.nodeBright : CONFIG.colors.node;

      const material = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const x = randomRange(
        -CONFIG.world.width / 2 + 5,
        CONFIG.world.width / 2 - 5,
      );
      const y = randomRange(
        -CONFIG.world.height / 2 + 5,
        CONFIG.world.height / 2 - 5,
      );

      mesh.position.set(x, y, 0);

      const node = {
        mesh,
        baseRadius,
        baseColor: new THREE.Color(baseColor),
        touchedColor: new THREE.Color(CONFIG.colors.nodeTouched),

        baseX: x,
        baseY: y,
        driftSeedX: Math.random() * 1000,
        driftSeedY: Math.random() * 1000,

        revealed: false,
        state: 0,
        pulse: 0,
        lastTouchTime: -999,
        energy: 0, // NEW: Energy System

        organicRotation: (Math.random() - 0.5) * Math.PI,
        organicTiltSeed: Math.random() * 1000,
        activationGlow: 0,
        visualOffset: new THREE.Vector3(0, 0, 0),

        organic: this.createOrganicVisual(baseRadius),
      };

      this.organicGroup.add(node.organic.group);
      this.nodes.push(node);
      this.nodeGroup.add(mesh);
    }
  }

  /*createOrganicVisual(baseRadius) {
    const group = new THREE.Group();
    group.visible = false;

    const shellGeometry = new THREE.RingGeometry(
      baseRadius * 1.8,
      baseRadius * 2.7,
      28,
    );
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.nodeTouched,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    group.add(shell);

    const filaments = [];
    for (let i = 0; i < CONFIG.organic.filamentCount; i++) {
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colors.nodeTouched,
        transparent: true,
        opacity: 0,
      });

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);

      const line = new THREE.Line(geometry, material);
      group.add(line);

      filaments.push({
        line,
        angleSeed: (i / CONFIG.organic.filamentCount) * Math.PI * 2,
        randomSeed: Math.random() * 1000,
      });
    }

    return {
      group,
      shell,
      filaments,
    };
  }*/

  createOrganicVisual(baseRadius) {
    const group = new THREE.Group();
    group.visible = false;

    const cocoonWidth = baseRadius * (5.0 + Math.random() * 1.8);
    const cocoonHeight = baseRadius * (3.2 + Math.random() * 1.6);

    // Irregular cocoon outline
    const outlineCount = 56;
    const outlinePoints = [];

    for (let i = 0; i <= outlineCount; i++) {
      const t = (i / outlineCount) * Math.PI * 2;

      const noise1 = Math.sin(t * 2 + Math.random() * 0.2) * 0.1;
      const noise2 = Math.sin(t * 5 + Math.random() * 0.2) * 0.05;
      const noise3 = Math.cos(t * 3 + Math.random() * 0.2) * 0.06;

      const rX = cocoonWidth * (0.48 + noise1 + noise2);
      const rY = cocoonHeight * (0.48 + noise1 + noise3);

      const x = Math.cos(t) * rX;
      const y = Math.sin(t) * rY;

      outlinePoints.push(new THREE.Vector3(x, y, 0));
    }

    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(
      outlinePoints,
    );
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.colors.nodeBright,
      transparent: true,
      opacity: 0,
    });
    const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
    group.add(outline);

    // Small central core
    const coreGeo = new THREE.CircleGeometry(baseRadius * 0.42, 18);
    const coreMat = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.nodeBright,
      transparent: true,
      opacity: 0,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Small hotspot near one side
    const hotspotGeo = new THREE.CircleGeometry(baseRadius * 0.22, 16);
    const hotspotMat = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.nodeTouched,
      transparent: true,
      opacity: 0,
    });
    const hotspot = new THREE.Mesh(hotspotGeo, hotspotMat);
    hotspot.position.set(cocoonWidth * 0.18, baseRadius * 0.05, 0.03);
    group.add(hotspot);

    // Double Layer: Outer Glow Halo
    const outerGeo = new THREE.RingGeometry(baseRadius * 1.5, baseRadius * 2.2, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.nodeBright,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const outerHalo = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerHalo);

    // Growing tentacles from center toward boundary
    const strands = [];
    for (let i = 0; i < 28; i++) {
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colors.nodeBright,
        transparent: true,
        opacity: 0,
      });

      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(geometry, material);
      group.add(line);

      const angle = Math.random() * Math.PI * 2;
      const targetRadiusScale = 0.55 + Math.random() * 0.35;

      strands.push({
        line,
        seed: Math.random() * 1000,
        angle,
        targetRadiusScale,
        bend: -0.25 + Math.random() * 0.5,
        thicknessBias: Math.random(),
      });
    }

    // Paint splash blobs instead of circles
    const splashes = [];
    for (let i = 0; i < 5; i++) {
      const splashShape = new THREE.Shape();
      const splashSize = baseRadius * (0.22 + Math.random() * 0.18);

      const pts = 10;
      for (let p = 0; p <= pts; p++) {
        const t = (p / pts) * Math.PI * 2;
        const rr =
          splashSize *
          (0.75 +
            Math.sin(t * 3 + Math.random()) * 0.18 +
            Math.random() * 0.22);

        const x = Math.cos(t) * rr;
        const y = Math.sin(t) * rr;

        if (p === 0) splashShape.moveTo(x, y);
        else splashShape.lineTo(x, y);
      }

      const geo = new THREE.ShapeGeometry(splashShape);
      const mat = new THREE.MeshBasicMaterial({
        color: CONFIG.colors.nodeTouched,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);

      splashes.push({
        mesh,
        seed: Math.random() * 1000,
        xNorm: -0.18 + Math.random() * 0.5,
        yNorm: -0.26 + Math.random() * 0.52,
        rot: Math.random() * Math.PI * 2,
      });
    }

    // Wispy external filaments
    const filaments = [];
    for (let i = 0; i < 6; i++) {
      const material = new THREE.LineBasicMaterial({
        color: CONFIG.colors.nodeBright,
        transparent: true,
        opacity: 0,
      });

      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(geometry, material);
      group.add(line);

      filaments.push({
        line,
        seed: Math.random() * 1000,
        offset: i / 5,
      });
    }

    return {
      group,
      outline,
      core,
      hotspot,
      outerHalo,
      strands,
      splashes,
      filaments,
      cocoonWidth,
      cocoonHeight,
    };
  }

  // --- NEW: Energy Decay Logic (Rebalanced) ---
  updateEnergyDecay(delta, elapsedTime) {
    const baseDecay = delta * 0.015;
    const delayedDecay = delta * 0.02;

    for (const node of this.nodes) {
      if (!node.revealed) continue;

      let decayRate = baseDecay;
      // Delay decay after last interaction
      if (elapsedTime - node.lastTouchTime > 2.5) {
        decayRate += delayedDecay;
      }

      // Decay energy
      node.energy = node.energy || 0;
      node.energy -= decayRate;
      node.energy = Math.max(0, node.energy);

      // Link Visual State: Map Energy to State for existing visual drivers
      node.state = Math.floor(node.energy * 3);
    }
  }

  update(delta, elapsedTime, audio) {
    this.audio = audio || this.audio;
    if (this.activationProgress < 1 && window.isCalibrated) {
        this.activationProgress += delta * 0.08;
    }

    this.updateReveal(delta);
    this.updateDrift(elapsedTime);
    this.updateRepulsion(delta);
    this.updateEnergyDecay(delta, elapsedTime); // NEW
    this.updateVisualState(delta, elapsedTime);
    this.rebuildConnectors(elapsedTime);

    this.haloPositions = []; // Clear for next frame
  }

  updateRepulsion(delta) {
    for (const node of this.nodes) {
      node.visualOffset.multiplyScalar(0.88);
    }

    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      if (a.state <= 0) continue;

      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        if (b.state <= 0) continue;

        const ax = a.mesh.position.x + a.visualOffset.x;
        const ay = a.mesh.position.y + a.visualOffset.y;
        const bx = b.mesh.position.x + b.visualOffset.x;
        const by = b.mesh.position.y + b.visualOffset.y;

        const dx = bx - ax;
        const dy = by - ay;
        const distSq = dx * dx + dy * dy;

        const minDist = (a.organic.cocoonWidth + b.organic.cocoonWidth) * 0.18;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const push = overlap * 0.5 * 0.12;

          a.visualOffset.x -= nx * push;
          a.visualOffset.y -= ny * push;

          b.visualOffset.x += nx * push;
          b.visualOffset.y += ny * push;
        }
      }
    }
  }

  updateReveal(delta) {
    this.revealProgress += CONFIG.nodes.revealSpeed * delta;

    const targetVisibleCount = Math.floor(
      this.nodes.length * this.activationProgress
    );

    while (this.visibleNodeCount < targetVisibleCount) {
      this.nodes[this.visibleNodeCount].revealed = true;
      this.visibleNodeCount++;
    }

    for (const node of this.nodes) {
      const targetOpacity = node.revealed ? 0.95 : 0;
      node.mesh.material.opacity +=
        (targetOpacity - node.mesh.material.opacity) * 0.08;
    }
  }

  updateDrift(elapsedTime) {
    const bass = this.audio?.bass || 0;

    const bassBoost = 1 + bass * 2.5;

    for (const node of this.nodes) {
      if (!node.revealed) continue;

      const dx =
        Math.sin(elapsedTime * 0.9 + node.driftSeedX) *
        CONFIG.nodes.driftAmount *
        bassBoost;

      const dy =
        Math.cos(elapsedTime * 0.7 + node.driftSeedY) *
        CONFIG.nodes.driftAmount *
        bassBoost;

      node.mesh.position.x = node.baseX + dx;
      node.mesh.position.y = node.baseY + dy;
    }
  }

  updateVisualState(delta, elapsedTime) {
    for (const node of this.nodes) {
      if (!node.revealed) continue;

      node.pulse = Math.max(
        0,
        node.pulse - delta * CONFIG.nodes.pulseDecaySpeed,
      );

      if (node.state <= 0) {
        const shimmer = Math.sin(elapsedTime * 2.0 + node.driftSeedX) * 0.03;

        node.mesh.scale.set(1, 1, 1);
        node.mesh.material.color
          .copy(node.baseColor)
          .lerp(node.touchedColor, Math.max(0, shimmer));
        node.mesh.material.opacity +=
          (node.energy * 0.95 - node.mesh.material.opacity) * 0.08;
      } else {
        // Once transformed, the base node should stop dominating
        node.mesh.scale.set(1, 1, 1);
        node.mesh.material.color.copy(node.baseColor);
      }

      this.updateOrganicNode(node, elapsedTime);
    }
  }

  /*updateOrganicNode(node, elapsedTime) {
    const organic = node.organic;
    const isActive = node.state > 0 || node.pulse > 0.05;

    organic.group.visible = isActive;
    if (!isActive) return;

    organic.group.position.copy(node.mesh.position);
    organic.group.position.z = 0.5;

    const life = Math.min(1, node.state * 0.28 + node.pulse * 0.5);
    const organicScale = 0.65 + node.state * 0.12 + node.pulse * 0.25;
    organic.group.scale.setScalar(organicScale);

    organic.shell.material.opacity = CONFIG.organic.shellOpacity * life;
    organic.shell.rotation.z = elapsedTime * 0.12 + node.driftSeedX;

    for (const filament of organic.filaments) {
      const a =
        filament.angleSeed +
        Math.sin(elapsedTime * 0.7 + filament.randomSeed) * 0.25;
      const r1 = node.baseRadius * 1.2;
      const r2 =
        node.baseRadius * (2.2 + node.state * 0.25 + node.pulse * 0.45);
      const bend = CONFIG.organic.wobbleAmount + node.pulse * 0.08;

      const p0 = new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, 0);

      const p1 = new THREE.Vector3(
        Math.cos(a + bend) * (r1 + r2) * 0.55,
        Math.sin(a - bend) * (r1 + r2) * 0.55,
        0,
      );

      const p2 = new THREE.Vector3(Math.cos(a) * r2, Math.sin(a) * r2, 0);

      filament.line.geometry.setFromPoints([p0, p1, p2]);
      filament.line.material.opacity =
        CONFIG.organic.filamentOpacity * life * (0.7 + node.pulse * 0.25);
    }
  }*/

  updateOrganicNode(node, elapsedTime) {
    const organic = node.organic;
    const active = node.state > 0 || node.pulse > 0.05;

    organic.group.visible = active;
    if (!active) return;

    node.activationGlow = Math.max(0, node.activationGlow - 0.012);

    organic.group.position.copy(node.mesh.position).add(node.visualOffset);
    organic.group.position.z = 0.5;

    const life = Math.min(1, node.state * 0.3 + node.pulse * 0.7);
    const growth = Math.min(1, node.state * 0.42 + node.pulse * 0.65);

    organic.group.rotation.z =
      node.organicRotation +
      Math.sin(elapsedTime * 0.22 + node.organicTiltSeed) * 0.08;

    organic.group.scale.setScalar(0.9 + node.state * 0.05 + node.pulse * 0.06);

    // Fade base node strongly after transformation
    node.mesh.scale.set(1, 1, 1);
    const nodeOpacityTarget = 0.035;
    node.mesh.material.opacity +=
      (nodeOpacityTarget - node.mesh.material.opacity) * 0.12;

    // Cocoon outline
    organic.outline.material.opacity = 0.14 + life * 0.24;

    // Core and hotspot with activation glow burst
    const glowBoost = node.activationGlow * 0.55;

    organic.core.material.opacity = 0.1 + life * 0.14 + glowBoost * 0.25;
    const highs = this.audio?.highs || 0;

    organic.hotspot.material.opacity =
      0.08 + life * 0.18 + glowBoost * 0.35 + highs * 0.25;

    organic.core.scale.setScalar(
      1 +
        Math.sin(elapsedTime * 1.4 + node.driftSeedX) * 0.02 +
        glowBoost * 0.22,
    );

    organic.hotspot.scale.setScalar(
      1 +
        Math.sin(elapsedTime * 1.9 + node.driftSeedY) * 0.03 +
        glowBoost * 0.3,
    );

    // Update Outer Glow Double Layer
    organic.outerHalo.material.opacity = (life * 0.1 + glowBoost * 0.25 + highs * 0.35);
    organic.outerHalo.scale.setScalar(
      1.1 + Math.sin(elapsedTime * 2.0 + node.driftSeedX) * 0.04 + highs * 0.4
    );

    // Paint splashes
    for (const splash of organic.splashes) {
      splash.mesh.position.set(
        splash.xNorm * organic.cocoonWidth +
          Math.sin(elapsedTime * 0.35 + splash.seed) * 0.06,
        splash.yNorm * organic.cocoonHeight +
          Math.cos(elapsedTime * 0.42 + splash.seed) * 0.06,
        0.02,
      );

      splash.mesh.rotation.z =
        splash.rot + Math.sin(elapsedTime * 0.3 + splash.seed) * 0.08;

      splash.mesh.material.opacity = 0.03 + life * 0.1;
    }

    // More strands become active with repeated interaction
    const activeStrandCount = Math.min(
      organic.strands.length,
      8 + node.state * 3,
    );

    for (let i = 0; i < organic.strands.length; i++) {
      const strand = organic.strands[i];
      const isActiveStrand = i < activeStrandCount;

      if (!isActiveStrand) {
        strand.line.material.opacity = 0;
        continue;
      }

      const angle = strand.angle;
      const maxRx = organic.cocoonWidth * 0.48 * strand.targetRadiusScale;
      const maxRy = organic.cocoonHeight * 0.48 * strand.targetRadiusScale;

      // Start slightly extended, then grow faster
      const reach = 0.28 + growth * 0.72;

      const endX = Math.cos(angle) * maxRx * reach;
      const endY = Math.sin(angle) * maxRy * reach;

      const c1x =
        Math.cos(angle + strand.bend) * maxRx * 0.35 * reach +
        Math.sin(elapsedTime * 0.7 + strand.seed) * 0.12;

      const c1y =
        Math.sin(angle - strand.bend) * maxRy * 0.35 * reach +
        Math.cos(elapsedTime * 0.8 + strand.seed) * 0.12;

      const c2x =
        Math.cos(angle + strand.bend * 0.5) * maxRx * 0.72 * reach +
        Math.cos(elapsedTime * 0.6 + strand.seed) * 0.08;

      const c2y =
        Math.sin(angle - strand.bend * 0.5) * maxRy * 0.72 * reach +
        Math.sin(elapsedTime * 0.75 + strand.seed) * 0.08;

      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0, 0.01),
        new THREE.Vector3(c1x, c1y, 0.01),
        new THREE.Vector3(c2x, c2y, 0.01),
        new THREE.Vector3(endX, endY, 0.01),
      );

      strand.line.geometry.setFromPoints(curve.getPoints(16));
      const peak = this.audio?.peak || 0;

      strand.line.material.opacity =
        0.05 +
        life * (0.1 + strand.thicknessBias * 0.07) +
        glowBoost * 0.1 +
        peak * 0.25;
    }

    // Outer wispy filaments
    for (const filament of organic.filaments) {
      const startX = organic.cocoonWidth * 0.22;
      const startY = (filament.offset - 0.5) * organic.cocoonHeight * 0.42;

      const len = organic.cocoonWidth * (0.22 + filament.offset * 0.12);

      const c1x = startX + len * 0.35;
      const c1y =
        startY +
        Math.sin(elapsedTime * 0.6 + filament.seed) *
          organic.cocoonHeight *
          0.07;

      const endX = startX + len;
      const endY =
        startY +
        Math.cos(elapsedTime * 0.5 + filament.seed) *
          organic.cocoonHeight *
          0.1;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startX, startY, 0.01),
        new THREE.Vector3(c1x, c1y, 0.01),
        new THREE.Vector3(endX, endY, 0.01),
      );

      filament.line.geometry.setFromPoints(curve.getPoints(12));
      filament.line.material.opacity = 0.05 + life * 0.12;
    }
  }

  interactWithCircle(circlePosition, circleRadius, elapsedTime) {
    const effectiveRadius = circleRadius * CONFIG.nodes.touchRadiusBoost;
    const revealRadiusSq = CONFIG.nodes.localRevealRadius * CONFIG.nodes.localRevealRadius;

    this.haloPositions = this.haloPositions || [];
    this.haloPositions.push(circlePosition.clone()); // Save for decay calculation

    for (const node of this.nodes) {
      const dx = circlePosition.x - node.mesh.position.x;
      const dy = circlePosition.y - node.mesh.position.y;
      const distSq = dx * dx + dy * dy;

      if (!node.revealed && distSq < revealRadiusSq) {
        node.revealed = true;
        this.visibleNodeCount = Math.max(
          this.visibleNodeCount,
          this.nodes.filter((n) => n.revealed).length,
        );
      }

      if (!node.revealed) continue;

      const collisionThreshold = effectiveRadius + node.baseRadius;

      if (distSq < collisionThreshold * collisionThreshold) {
        const timeSinceLastTouch = elapsedTime - node.lastTouchTime;

        if (timeSinceLastTouch > CONFIG.nodes.touchCooldown) {
          node.energy = node.energy || 0;

          // First Touch Boost
          if (node.state === 0) {
              node.energy += 0.4;
              node.state += 2;
          }

          node.state += 1.5;
          node.pulse = Math.min(node.pulse + 1.5, 3.0);
          node.activationGlow = 1.0;
          node.lastTouchTime = elapsedTime;
          node.energy = Math.min(1.0, node.energy + 0.8); // +0.8 Energy Boost
        }
      }
    }
  }

  rebuildConnectors(elapsedTime) {
    const mids = this.audio?.mids || 0;
    let activeLineIndex = 0;

    for (let k = 0; k < this.visibleNodeCount; k++) {
      if (this.nodes[k]) this.nodes[k].connectCount = 0;
    }

    for (let i = 0; i < this.visibleNodeCount; i++) {
      const a = this.nodes[i];
      if (!a.revealed) continue;

      for (let j = i + 1; j < this.visibleNodeCount; j++) {
        const b = this.nodes[j];
        if (!b.revealed) continue;

        const dx = a.mesh.position.x - b.mesh.position.x;
        const dy = a.mesh.position.y - b.mesh.position.y;
        const distSq = dx * dx + dy * dy;
        
        // Dynamically boost connection distance based on audio volume (mids/level)
        const densityBoost = 1 + (this.audio?.level || 0) * 0.5;
        const maxDist = CONFIG.nodes.lineDistance * densityBoost;

        if (distSq > maxDist * maxDist) continue;

        // Filter Rule: Connected node energy sum gate
        const energyA = a.energy || 0;
        const energyB = b.energy || 0;
        if (energyA + energyB <= 0.6) continue;

        // Count Threshold: Cap connections at 3
        if ((a.connectCount || 0) >= 3 || (b.connectCount || 0) >= 3) continue;

        a.connectCount = (a.connectCount || 0) + 1;
        b.connectCount = (b.connectCount || 0) + 1;

        const dist = Math.sqrt(distSq);

        const mid = a.mesh.position
          .clone()
          .add(b.mesh.position)
          .multiplyScalar(0.5);
        const dir = b.mesh.position.clone().sub(a.mesh.position);
        const normal = new THREE.Vector3(-dir.y, dir.x, 0).normalize();

        const curveOffset =
          dist *
          CONFIG.connectors.curveStrength *
          Math.sin(elapsedTime * 0.35 + a.driftSeedX + b.driftSeedY);

        const control = mid.add(normal.multiplyScalar(curveOffset));

        const curve = new THREE.QuadraticBezierCurve3(
          a.mesh.position.clone(),
          control,
          b.mesh.position.clone(),
        );

        const points = curve.getPoints(CONFIG.connectors.subdivisions);
        const baseOpacity =
          (1 - dist / maxDist) * CONFIG.nodes.lineOpacity;

        const energyBoost = Math.min(
          0.25,
          (a.pulse + b.pulse) * 0.06 + (a.state + b.state) * 0.015,
        );

        const audioBoost = mids * 0.35;
        const targetOpacity = baseOpacity + energyBoost + audioBoost;

        let line;
        if (activeLineIndex < this.linePool.length) {
          line = this.linePool[activeLineIndex];
          line.geometry.setFromPoints(points);
          line.material.opacity = targetOpacity;
          line.visible = true;
        } else {
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: CONFIG.colors.line,
            transparent: true,
            opacity: targetOpacity,
          });
          line = new THREE.Line(geometry, material);
          this.linePool.push(line);
          this.lineGroup.add(line);
        }

        activeLineIndex++;
      }
    }

    // Hide any extra lines in the pool that we didn't use this frame
    for (let k = activeLineIndex; k < this.linePool.length; k++) {
      this.linePool[k].visible = false;
    }
  }
}

```

## src/visuals/particleField.js

```javascript
import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export class ParticleField {
  constructor(scene) {
    this.scene = scene;
    this.audio = {
      bass: 0,
      mids: 0,
      highs: 0,
      level: 0,
      peak: 0,
    };

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.swatches = [];
    this.dust = [];
    //this.dustTexture = this.createSoftDustTexture();
    this.dustTexture = this.createBlobTexture({
      tint: "255,255,255",
      alpha: 0.35,
    });

    this.createBlueHaze();
    this.createSwatches();
    this.createDust();
  }

  createDust() {
    for (let i = 0; i < CONFIG.dust.count; i++) {
      const isBlue = Math.random() < 0.18;

      const material = new THREE.SpriteMaterial({
        map: this.dustTexture,
        color: isBlue ? 0x8ea6d8 : 0xf2ead0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      material.depthTest = false;

      const sprite = new THREE.Sprite(material);

      const worldScale = CONFIG.world.width * 0.12;

      const size = worldScale * randomRange(0.6, 2.2);

      const x = randomRange(-CONFIG.world.width / 2, CONFIG.world.width / 2);
      const y = randomRange(-CONFIG.world.height / 2, CONFIG.world.height / 2);
      const z = randomRange(-1.2, -0.4);

      sprite.position.set(x, y, z);

      const scaleX = size * randomRange(1.4, 2.8);
      const scaleY = size * randomRange(0.8, 1.8);
      sprite.scale.set(scaleX, scaleY, 1);

      sprite.material.rotation = randomRange(0, Math.PI * 2);

      this.group.add(sprite);

      this.dust.push({
        sprite,
        baseX: x,
        baseY: y,
        baseZ: z,
        baseScaleX: scaleX,
        baseScaleY: scaleY,
        driftSeedX: Math.random() * 1000,
        driftSeedY: Math.random() * 1000,
        pulseSeed: Math.random() * 1000,
        rotSeed: Math.random() * 1000,
        isBlue,
      });
    }

    console.log("dust count", this.dust.length);
  }

  createSoftDustTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    gradient.addColorStop(0.0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.45)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createBlueHaze() {
    const hazeGeometry = new THREE.PlaneGeometry(
      CONFIG.world.width * 2.2,
      CONFIG.world.height * 2.2,
    );

    const hazeMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.hazeBlue,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });

    this.haze = new THREE.Mesh(hazeGeometry, hazeMaterial);
    this.haze.position.set(0, 0, -10);

    this.group.add(this.haze);
  }

  createDustTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createBlobTexture({ tint = "255,255,255", alpha = 1 }) {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    for (let i = 0; i < 7; i++) {
      const ox = cx + randomRange(-45, 45);
      const oy = cy + randomRange(-45, 45);
      const r = randomRange(30, 85);

      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
      g.addColorStop(0, `rgba(${tint},${0.22 * alpha})`);
      g.addColorStop(0.45, `rgba(${tint},${0.1 * alpha})`);
      g.addColorStop(1, `rgba(${tint},0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createSwatches() {
    for (let i = 0; i < CONFIG.particles.count; i++) {
      const isBlue = Math.random() < 0.78;

      const texture = this.createBlobTexture({
        tint: isBlue ? "120,150,255" : "240,228,190",
        alpha: isBlue ? 0.9 : 0.7,
      });

      const material = new THREE.SpriteMaterial({
        map: texture,
        color: isBlue ? CONFIG.colors.particleBlue : CONFIG.colors.particleGold,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(material);

      const size = randomRange(
        CONFIG.particles.baseSize * 0.8,
        CONFIG.particles.baseSize * 2.4,
      );

      const x = randomRange(-CONFIG.world.width / 2, CONFIG.world.width / 2);
      const y = randomRange(-CONFIG.world.height / 2, CONFIG.world.height / 2);
      const z = randomRange(-9, -4);

      sprite.position.set(x, y, z);
      sprite.scale.set(size, size * randomRange(0.8, 1.25), 1);

      this.group.add(sprite);

      this.swatches.push({
        sprite,
        baseX: x,
        baseY: y,
        baseZ: z,
        baseScaleX: sprite.scale.x,
        baseScaleY: sprite.scale.y,
        driftSeedX: Math.random() * 1000,
        driftSeedY: Math.random() * 1000,
        pulseSeed: Math.random() * 1000,
        isBlue,
      });
    }
  }

  update(elapsedTime, audio) {
    this.audio = audio || this.audio;

    const level = this.audio?.level || 0;
    const bass = this.audio?.bass || 0;
    const highs = this.audio?.highs || 0;

    this.haze.material.opacity = Math.min(
      0.26,
      0.14 + level * 0.04 + bass * 0.05,
    );

    const hazeScale = 1 + bass * 0.03;
    this.haze.scale.set(hazeScale, hazeScale, 1);

    this.haze.rotation.z = Math.sin(elapsedTime * 0.02) * 0.03;

    //swatch loop
    for (const swatch of this.swatches) {
      const dx =
        Math.sin(elapsedTime * 0.06 + swatch.driftSeedX) *
        CONFIG.particles.driftAmount *
        (1 + bass * 0.6);

      const dy =
        Math.cos(elapsedTime * 0.05 + swatch.driftSeedY) *
        CONFIG.particles.driftAmount *
        (1 + level * 0.5);

      swatch.sprite.position.x = swatch.baseX + dx;
      swatch.sprite.position.y = swatch.baseY + dy;

      const flicker =
        0.92 +
        0.08 * Math.sin(elapsedTime * 0.25 + swatch.pulseSeed + highs * 2);

      const targetOpacity =
        (swatch.isBlue ? 0.3 : 0.085) + level * 0.025 + bass * 0.02;

      swatch.sprite.material.opacity = Math.min(
        swatch.isBlue ? 0.16 : 0.15,
        targetOpacity * flicker,
      );

      const sizeBoost = 1 + level * 0.05 + bass * 0.05;

      swatch.sprite.scale.set(
        swatch.baseScaleX * sizeBoost,
        swatch.baseScaleY * sizeBoost,
        1,
      );
    }

    //dust loop
    for (const mote of this.dust) {
      const dx =
        Math.sin(elapsedTime * 0.08 + mote.driftSeedX) *
        CONFIG.dust.driftAmount *
        (1 + bass * 0.25);

      const dy =
        Math.cos(elapsedTime * 0.07 + mote.driftSeedY) *
        CONFIG.dust.driftAmount *
        (1 + level * 0.2);

      mote.sprite.position.x = mote.baseX + dx;
      mote.sprite.position.y = mote.baseY + dy;

      mote.sprite.material.rotation =
        Math.sin(elapsedTime * 0.05 + mote.rotSeed) * 0.4;

      const flicker =
        0.9 + 0.1 * Math.sin(elapsedTime * 0.3 + mote.pulseSeed + highs);

      const targetOpacity = CONFIG.dust.opacity + level * 0.01 + highs * 0.008;

      mote.sprite.material.opacity = Math.min(0.08, targetOpacity * flicker);

      const scaleBoost = 1 + level * 0.03;

      mote.sprite.scale.set(
        mote.baseScaleX * scaleBoost,
        mote.baseScaleY * scaleBoost,
        1,
      );
    }
  }
}

```

