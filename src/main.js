/*
 * FILE: src/main.js
 * SYSTEM: Core / Director
 * RESPONSIBILITY: The primary orchestrator. Stitches the Three.js scene, Audio contexts, Pose Tracker, and all geometric rendering systems together. Runs the main requestAnimationFrame loop. Controls macro-phases (Initialization -> Build-up -> Performance -> Finale).
 * INTERACTION: The heart of the application. Imports almost everything.
 * VISUAL RESULT: Ensures timing is perfect, graphics flow smoothly into each other, text cycles correctly, and UI actions trigger the right visual cascades.
 */

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

const clock = new THREE.Clock(); // ThreeJS helper to map animation to actual time, not refresh rate
let isRunning = false;
let isOutroActive = false;
let frozenHaloPosition = null;
let haloScaleTarget = 3.0;

let finaleHoldTimer = 0;
let performanceStarted = false;
let isCalibrated = false;

// Keeps track of the 15-second intro phase
let buildTimer = 0; 
let trackingEnabled = false;

// --- TEXT MANAGEMENT ---
// Pool of abstract conceptual words to cycle through standard performance logic
const HALO_WORDS = [
  "choice", "truth", "belief", "ethics", "thoughts", "feelings",
  "emotions", "oneness", "love", "devotion", "morals", "values"
];
let activeWords = ["", "", ""];
let wordTimers = [0, 0, 0];
let wordIntervals = [0, 0, 0]; // Randomized gap between drawing a new word

/**
 * 1. LIFECYCLE: Initialization
 * Executed instantly when DOM loads. Boots up Three.js and injects it into the page, but keeps things hidden/black until interaction.
 */
function initVisuals() {
  const setup = setupScene();
  scene = setup.scene;
  camera = setup.camera;
  renderer = setup.renderer;
  
  // Background subsystems
  nodeField = new NodeField(scene);
  particleField = new ParticleField(scene);

  // Pre-generate the Halos based on config limit
  for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
    const halo = new CircleAgent(scene);

    // Apply specific color theme from config arrays so differentiating singers is easy
    const colorHex = CONFIG.singerColors[i];
    halo.glow.material.color.setHex(colorHex);
    halo.ring.material.color.setHex(colorHex);
    halo.core.material.color.setHex(CONFIG.colors.circleCore);

    halo.group.visible = false;

    // Cache exact material opacities so the "Ghost" fading logic has a guaranteed maximum benchmark to fade back toward later.
    halo.defaultGlowOpacity = 0.12;
    halo.defaultCoreOpacity = 0.0;
    halo.defaultRingOpacity = 0.45;
    halo.defaultTextOpacity = 0.9; 

    halos.push(halo);
  }
  
  renderer.render(scene, camera);
  
  // IMMEDIATELY Start the background animation loop.
  // WHY: If we don't start the clock immediately, Three.js draws one flat immovable frame.
  clock.start();
  animate();
}

/**
 * Driven by the user clicking the screen over the Initial Intro Layer.
 * Asynchronously demands Camera and Microphone permissions.
 */
async function startExperience() {
  if (isRunning) return;
  isRunning = true;
  
  const initInstruction = document.getElementById('init-instruction');
  if (initInstruction) {
    initInstruction.innerText = "Initializing camera and microphone...";
    initInstruction.style.animation = "none";
  }

  // Await heavy hardware IO setup
  const cameraManager = new CameraManager();
  const videoElement = await cameraManager.initialize();

  audioInput = new AudioInput();
  await audioInput.initFromMicrophone();
  await audioInput.resumeAndPlay();

  poseTracker = new PoseTracker();
  await poseTracker.initialize(videoElement);
  
  // Show "Press C to Calibrate" instruction
  if (initInstruction) initInstruction.style.display = 'none';
  const startInstruction = document.getElementById('start-instruction');
  if (startInstruction) startInstruction.style.display = 'block';
}

/** DOM EVENT BINDINGS */
document.addEventListener('DOMContentLoaded', () => {
  initVisuals();
  document.getElementById('start-overlay').addEventListener('click', startExperience);

  // VJ Tools toggler (hidden button in top left)
  const adminToggle = document.getElementById('admin-toggle');
  const adminControls = document.getElementById('admin-controls');

  adminToggle.addEventListener('mouseenter', () => adminToggle.style.opacity = '1');
  adminToggle.addEventListener('mouseleave', () => {
    if (adminControls.style.display === 'none') adminToggle.style.opacity = '0.2';
  });

  adminToggle.addEventListener('click', () => {
    adminControls.style.display = adminControls.style.display === 'none' ? 'flex' : 'none';
  });

  // Buttons inside the VJ control panel
  document.getElementById('btn-calibrate').addEventListener('click', () => {
    if (poseTracker) poseTracker.calibrateStage();
  });
  document.getElementById('btn-force-finale').addEventListener('click', triggerManualFinale);

  // Master Keyboard Hooks
  window.addEventListener('keydown', (e) => {
    // 2. LIFECYCLE: Calibration
    if (e.key === 'c' || e.key === 'C') {
      if (poseTracker) {
        poseTracker.calibrateStage();

        // C acts as the absolute start gun for the visual performance.
        if (!isCalibrated) {
            isCalibrated = true;
            buildTimer = 0; // Starts the 15-second node fade-in timer globally
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
    // "F" universally initiates the end of the show
    if (e.key === 'f' || e.key === 'F') triggerManualFinale();
  });
});

/**
 * 6. LIFECYCLE: Finale
 * Unbinds the halo from camera tracking, locks its position rigidly, scales it up, sets the final text, and rolls credits.
 */
function triggerManualFinale() {
  if (isOutroActive) return;
  const halo = halos[0];
  if (!halo || !halo.group) return;

  isOutroActive = true;

  // Emergency safety check: If Math resulted in NaN scale, fix it.
  if (!isFinite(halo.group.scale.x)) {
    halo.group.scale.setScalar(1.0);
  }

  // Lock the halo forever wherever the singer was standing when F was pressed.
  frozenHaloPosition = halo.currentPosition.clone();

  // Hide all fallback halos visually (if we had more than 1 running)
  halos.forEach((h, i) => {
    if (i !== 0) h.group.visible = false;
  });

  // Grow 40% larger than whatever scale they were currently dynamically at
  haloScaleTarget = halo.group.scale.x * 1.4;
  haloScaleTarget = Math.min(haloScaleTarget, 6.0); // Strict safety clamp

  // Absolute hardcoded endgame text
  halo.setWord("YOU ARE\nTHE WORLD");
  halo.lockScale = true;

  halo.group.visible = true;
  // Ensure the text isn't randomly faded out during a ghost state
  halo.textSprite.material.opacity = 1.0; 

  // Crossfade in the HTML-based credits screen laying over everything
  const finaleLayer = document.getElementById('finale-layer');
  const credits = document.getElementById('credits');

  if (finaleLayer) finaleLayer.style.display = 'flex';

  setTimeout(() => {
    if (credits) {
      credits.style.opacity = 1;
      const scrollWrapper = credits.querySelector('.scroll-wrapper');
      // Begin CSS-based scroll up
      if (scrollWrapper) {
        scrollWrapper.style.animation = 'scroll-up 48s linear forwards';
      }
    }
  }, 800);
}

/**
 * 4. LIFECYCLE: Main Output Engine
 * The absolutely critical per-frame recursive animation block.
 */
function animate() {
  requestAnimationFrame(animate);
  // Get Delta ensures that fast/slow computers see motion at the same functional physical speed.
  const delta = clock.getDelta(); 
  const elapsedTime = clock.getElapsedTime();

  // If F was pressed, intercept standard tracking logic and override purely with Finale logic
  if (isOutroActive) {
    const halo = halos[0];
    halo.update(frozenHaloPosition, elapsedTime);
    
    // Smoothly balloon the scale over time toward the oversized target
    const currentScale = halo.group.scale.x;
    if (!isFinite(currentScale) || currentScale <= 0) {
      halo.group.scale.setScalar(1.0);
    }
    const newScale = currentScale + (haloScaleTarget - currentScale) * 0.05;
    halo.group.scale.setScalar(newScale);

    // Audio/nodes continue processing in Outro, creating beautiful background decay
    const audioFeatures = audioInput ? audioInput.update() : { volume: 0, highFreq: 0, lowFreq: 0 };
    nodeField.update(delta, elapsedTime, audioFeatures);
    particleField.update(elapsedTime, audioFeatures);
    
    renderer.render(scene, camera);
    return;
  }

  // 3. LIFECYCLE: Build Phase
  // Unlocks the node reveal and delay timers. 
  if (isCalibrated) {
      buildTimer += delta;
  }
  window.isCalibrated = isCalibrated; // Used by nodes.js heavily to gate progression

  // 5. LIFECYCLE: Standard Activity
  if (poseTracker) poseTracker.update();
  const audioFeatures = audioInput ? audioInput.update() : { volume: 0, highFreq: 0, lowFreq: 0 };

  if (!isOutroActive) {
    let activeHalos = 0;
    let combinedPosition = new THREE.Vector3();

    // Dynamically query canvas size so logic spans the real viewport
    const aspect = window.innerWidth / window.innerHeight;
    const dynamicWorldWidth = CONFIG.world.height * aspect;

    for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
      const halo = halos[i];
      
      // DO NOT SHOW HALOS UNTIL C IS PRESSED
      if (!isCalibrated) {
        halo.group.visible = false;
        continue;
      }

      // DO NOT SHOW HALOS UNTIL 15 SECONDS HAVE PASSED
      if (buildTimer < 15) {
        halo.group.visible = false;
        continue;
      }

      trackingEnabled = true;
      const trackedData = poseTracker.getMappedWorldData(i, dynamicWorldWidth, CONFIG.world.height);

      if (trackedData && trackedData.visible) {
        halo.group.visible = true;
        
        // Feed the extracted data into the visual agent
        const targetWorld = new THREE.Vector3(trackedData.x, trackedData.y, 0);
        halo.group.scale.setScalar(trackedData.scale);
        halo.update(targetWorld, elapsedTime);

        // --- WORD CYCLING LOGIC ---
        // Every (3 to 5) seconds, pick a completely unprecedented unique word from the list
        // and redraw it into the halo canvas.
        wordTimers[i] += delta;
        if (wordTimers[i] > wordIntervals[i]) {
          wordTimers[i] = 0;
          wordIntervals[i] = 3 + Math.random() * 2;

          // Deduplicate across all active halos automatically
          const availableWords = HALO_WORDS.filter(w => !activeWords.includes(w));
          const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];
          activeWords[i] = newWord;
          halo.setWord(newWord);
        }
        
        // --- GHOST OVERRIDES ---
        // What happens when tracking fails? We don't want the halo to snap off.
        // It smoothly lerps down to 0 opacity over about 2 seconds.
        if (trackedData.ghost) {
          halo.ghostOpacity = (halo.ghostOpacity ?? 1.0) - (delta * 0.4);
          if (halo.ghostOpacity <= 0) {
            halo.group.visible = false;
            poseTracker.singers[i].ghost = false; // Disable until detected again
          } else {
            // Re-apply multiplied opacity
            halo.core.material.opacity = halo.defaultCoreOpacity * halo.ghostOpacity;
            halo.glow.material.opacity = halo.defaultGlowOpacity * halo.ghostOpacity;
            halo.ring.material.opacity = halo.defaultRingOpacity * halo.ghostOpacity;
            halo.textSprite.material.opacity = halo.defaultTextOpacity * halo.ghostOpacity; 
          }
        } else {
          // Normal Active Behavior: Restore opacity and broadcast collisions
          halo.ghostOpacity = 0.0;
          halo.textSprite.material.opacity = halo.defaultTextOpacity; 

          activeHalos++;
          combinedPosition.add(halo.currentPosition);

          // FIRE THE COLLISION EXPERIMENT: Pass current scaled halo properties to the nodeField
          // so it triggers ripples and bioluminescent transformations.
          const scaledRadius = CONFIG.circle.radius * trackedData.scale * 1.8;
          nodeField.interactWithCircle(halo.currentPosition, scaledRadius, elapsedTime);
        }
      } else {
        halo.group.visible = false;
        halo.ghostOpacity = 1.0;
      }
    }

    finaleHoldTimer = 0;
  }

  // Ensure these loops process delta and audio regardless of states
  nodeField.update(delta, elapsedTime, audioFeatures);
  particleField.update(elapsedTime, audioFeatures);
  
  // Actually render the mathematical frame to the pixel screen.
  renderer.render(scene, camera);
}