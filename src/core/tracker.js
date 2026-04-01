/*
 * FILE: src/core/tracker.js
 * SYSTEM: Core / Tracking Physics
 * RESPONSIBILITY: Consumes the raw camera feed, loads Google's MediaPipe Pose model, and translates 3D human body landmarks into filtered, physics-smoothed, scaled X/Y coordinates for the visual halos to follow.
 * INTERACTION: Receives the video element from main.js/camera.js. Provides a clean data packet `getMappedWorldData` back to main.js per frame for the `circleAgent`.
 * VISUAL RESULT: The fluid, buttery-smooth movement of the halos. This file eliminates robotic twitching and jitter, making the halos feel heavy, intentional, and solidly locked to the performer.
 */

import { CONFIG } from '../utils/config.js';

export class PoseTracker {
    constructor(videoElement = null) {
        this.video = videoElement || document.getElementById("webcam");
        this.poseLandmarker = null;
        this.isReady = false;
        
        // Prevents processing the exact same video frame twice
        this.lastVideoTime = -1;

        // The internal data structure managing target and physics states for every allowed singer.
        this.singers = [];
        for (let i = 0; i < CONFIG.tracking.maxSingers; i++) {
            this.singers.push({
                active: false,
                ghost: false,
                lostFrames: 0,
                
                // Current physics position
                x: 0, y: 0,
                
                // Velocity
                vx: 0, vy: 0,
                
                // Desired position extracted from MediaPipe
                targetX: 0, targetY: 0,
                
                // Physics scale based on singer depth mapping
                scale: 1.0,
                targetScale: 1.0,
                vScale: 0,
                
                // Initial baseline position so they don't all spawn at 0,0
                defaultSortPosition: (i + 1) / (CONFIG.tracking.maxSingers + 1)
            });
            // Pre-position them left-to-right so the first detection snaps to the right person
            this.singers[i].x = this.singers[i].defaultSortPosition;
            this.singers[i].targetX = this.singers[i].defaultSortPosition;
        }

        // CALIBRATION LOGIC
        // Used to map a narrow physical stage (e.g. 3 feet wide) to the edges of the screen
        this.calibration = { minX: 0.1, maxX: 0.9, active: false };
        this.setupCalibrationListener();
    }

    async initialize(externalVideoElement = null) {
        if (externalVideoElement) {
            this.video = externalVideoElement;
        }
        await this.setupMediaPipe();
        this.isReady = true;
        
        // Update the invisible UI overlay
        document.getElementById("status").innerText = "Tracking Active";
        document.getElementById("status").style.color = "#00ff00";
    }

    /**
     * Bootstraps Google's MediaPipe WASM bundle from CDN.
     * PERFORMANCE NOTE: Utilizing 'GPU' delegate directly accelerates matrix math in the browser.
     * We use `POSE_LANDMARKER_LITE` to maintain 60FPS. Heavy/Full models are too stuttery for live music.
     */
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

    /**
     * CALIBRATION: The "C" key dynamically sets bounds based on where the singer is currently standing.
     * Problem Solved: If the camera is far back, the singer might only physically cover 30% of the video array. 
     * This remaps that 30% to equal 100% of the screen space so they can reach the edges physically.
     */
    calibrateStage() {
        const activeXs = this.singers.filter(s => s.active).map(s => s.targetX);
        if (activeXs.length > 0) {
            this.calibration.minX = Math.min(...activeXs);
            this.calibration.maxX = Math.max(...activeXs);

            // SAFEGUARD: If a single singer calibrates, min and max would be equal (div by zero error later).
            // We force a minimum 60% spread window around the center point.
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

    /**
     * The master tracking loop.
     * Pulls AI data -> Extracts Torso/Hands -> Maps to Screen Coordinates -> Applies Elastic Physics.
     */
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
            // SINGLE SINGER MODE: Only deal with the first detected pose structure
            const pose = results.landmarks[0]; 
            const singer = this.singers[0];

            // 11 and 12 are left/right shoulders in MediaPipe skeleton
            if (pose[11] && pose[12]) {
                // Determine Central Anchor Point
                // We use the midpoint between the shoulders as the absolute base position.
                // Note: The X coordinate is inverted (1.0 - x) because cameras mirror images naturally.
                const torsoX = 1.0 - ((pose[11].x + pose[12].x) / 2); 
                
                // Crop out noise. If the shoulder center is outside the safe zone (20% to 80%), ignore it.
                // Visual Impact: Prevents tracking people walking randomly far in the background edge.
                const isInZone = torsoX >= CONFIG.tracking.zoneMinX && torsoX <= CONFIG.tracking.zoneMaxX;

                if (isInZone) {
                    singer.activeThisFrame = true;
                    // Reset Ghost timeout counter
                    singer.lostFrames = 0;
                    if (!singer.active) { singer.active = true; singer.ghost = false; }

                    const leftShoulder = pose[11], rightShoulder = pose[12];
                    const leftHip = pose[23], rightHip = pose[24]; // Used for stable vertical anchoring
                    const leftWrist = pose[15], rightWrist = pose[16];

                    // Used as an estimation of physical depth / closeness to camera
                    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

                    // 1. Torso Base Position
                    let torsoY = (leftShoulder.y + rightShoulder.y) / 2;
                    // If the camera can see hips, average them. Hips bounce less than shoulders when breathing.
                    if (leftHip && rightHip) {
                        torsoY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
                    }

                    // 2. Hands as Offset (The Magic Sauce)
                    // If we just tracked the body, the halo sits solidly on the chest like a target. Boring.
                    // By factoring in the wrists, raising an arm physically pulls the halo toward the hand.
                    // This makes the visuals feel 'directed' and expressive.
                    let handX = torsoX;
                    let handY = torsoY;
                    let handCount = 0;

                    // Enforce threshold if visibility exists from MediaPipe Model confidence
                    const isLeftValid = leftWrist && (leftWrist.visibility === undefined || leftWrist.visibility > 0.5);
                    const isRightValid = rightWrist && (rightWrist.visibility === undefined || rightWrist.visibility > 0.5);

                    if (isLeftValid) {
                        handX += (1.0 - leftWrist.x); 
                        handY += leftWrist.y;
                        handCount++;
                    }
                    if (isRightValid) {
                        handX += (1.0 - rightWrist.x);
                        handY += rightWrist.y;
                        handCount++;
                    }

                    if (handCount > 0) {
                        handX = (handX - torsoX) / handCount + torsoX;
                        handY = (handY - torsoY) / handCount + torsoY;
                    }

                    // 3. Final Horizontal Mapping 
                    // Calculate how far the hand is pulling the anchor...
                    const offsetX = handX - torsoX;
                    // ...but only apply 85% of that pull so the halo still heavily grounds to the body.
                    const boostFactor = 0.85; 
                    singer.targetX = torsoX + offsetX * boostFactor;
                    
                    // HARD CLAMP
                    // ⚠️ SENSITIVE: This fixes a severe bug where flicking a wrist too fast would fling 
                    // the halo off-screen entirely. It locks the target to inside the screen.
                    singer.targetX = Math.max(0.05, Math.min(0.95, singer.targetX));

                    // Vertical Movement: Normalize around center & Amplify
                    // AI gives 0.0 to 1.0 (top to bottom). We normalize this to -1 to +1 relative to the center.
                    const centeredY = torsoY - 0.5;
                    const verticalRange = 0.25; // Squeeze the physical range into a smaller screen mapping
                    let finalY = centeredY / verticalRange;
                    finalY = Math.max(-1, Math.min(1, finalY)); // Clamp extreme jumps
                    finalY += (handY - torsoY) * 0.5; // Apply hand pull

                    // Map to 3D Scene space - ThreeJS Orthographic Y is inverted compared to video feeds
                    singer.targetY = -finalY; 
                    singer.targetY = Math.max(-1.0, Math.min(1.0, singer.targetY)); // Bounding limits

                    // 4. Deadzone (Anti-Jitter)
                    // ⚠️ EXTREMELY SENSITIVE ANTI-JITTER
                    // If the difference between the current halo location and the newly calculated location is tiny (< 0.07x / 0.04y),
                    // IGNORE THE MATH AND DO NOT MOVE. This prevents the halo from nervously vibrating 60 times a second 
                    // due to pixel imperfections in the AI camera analysis.
                    if (Math.abs(singer.targetX - singer.x) < 0.07) singer.targetX = singer.x;
                    if (Math.abs(singer.targetY - singer.y) < 0.04) singer.targetY = singer.y;

                    // 5. Scale Logic (Trigger Depth)
                    // Visual Impact: Walking very close to the camera blows the halo up 3x larger.
                    singer.targetScale = Math.max(1.0, Math.min(1.0 + (Math.max(0, shoulderWidth - 0.05) * 6.0), 3.0));

                } else {
                    // Out of zone - but singer logic is still "Running"
                    // Visual Impact: If a singer walks off the side of the stage, the halo elegantly floats to the center of the screen instead of crashing.
                    singer.activeThisFrame = true;
                    singer.lostFrames = 0;
                    singer.targetX = 0.5;
                    singer.targetY = 0;
                }
            }
        }

        // --- GLOBAL PHYSICS SMOOTHING (THE ELASTIC SPRING TRICK) ---
        // Loops through the extracted mathematical targets and applies inertia to them.
        for (let s of this.singers) {
            // "Ghost" Timeout Logic
            // If the camera goes totally blind randomly, wait 90 frames before fading the singer out completely.
            // Recenter them while fading.
            if (!s.activeThisFrame && s.active) {
                s.lostFrames++;
                if (s.lostFrames > CONFIG.tracking.maxLostFrames) {
                    s.active = false;
                    s.ghost = true;
                    s.targetX = 0.5; 
                    s.targetY = 0;
                    s.targetScale = 1.0;
                }
            }

            if (s.active || s.ghost) {
                // Hooke's Law: F = -kX. 
                // The further away the halo is from the mathematical target, the faster it snaps toward it.
                // Friction (0.85) ensures it slides smoothly to a halt instead of bouncing infinitely.
                // ⚠️ SENSITIVE: Breaking this breaks all smooth motion.
                const ax = (s.targetX - s.x) * CONFIG.tracking.springTension;
                s.vx = (s.vx + ax) * CONFIG.tracking.springFriction;
                s.x += s.vx;

                const ay = (s.targetY - s.y) * CONFIG.tracking.springTension;
                s.vy = (s.vy + ay) * CONFIG.tracking.springFriction;
                s.y += s.vy;

                // Max velocity clamps: Stops teleporting/violently fast whipping
                s.vx = Math.max(-0.02, Math.min(0.02, s.vx));
                s.vy = Math.max(-0.02, Math.min(0.02, s.vy));

                // Apply the exact same spring logic to Scale (size inflation)
                const aScale = (s.targetScale - s.scale) * CONFIG.tracking.scaleTension;
                s.vScale = (s.vScale + aScale) * CONFIG.tracking.scaleFriction;
                s.scale += s.vScale;
                s.scale = Math.max(0.8, Math.min(3.0, s.scale));
            }
        }
    }

    /**
     * Packages the smoothed physics data and maps it fully into Three.js geometric coordinate space.
     * @param {number} singerIndex 
     * @param {number} worldWidth Ortho Frustum Width
     * @param {number} worldHeight Ortho Frustum Height
     * @returns {Object} {visible, ghost, x, y, scale}
     */
    getMappedWorldData(singerIndex, worldWidth, worldHeight) {
        const s = this.singers[singerIndex];
        if (!s.active && !s.ghost) return { visible: false };

        // Start with the raw 0.0 to 1.0 physics position
        let normalizedX = s.x;
        
        // APPLY CALIBRATION REMAPPING (If 'C' was pressed)
        // If they only operate in the middle 30% of the screen, stretch that 30% to fill 100%.
        if (this.calibration.active) {
            normalizedX = (s.x - this.calibration.minX) / (this.calibration.maxX - this.calibration.minX);
        }
        normalizedX = Math.max(0, Math.min(1, normalizedX));
        
        // Shrink the available 3D stage physically by `stageMarginX` percentages on both sides 
        // to prevent the halo getting cut in half by overlapping the literal edge of the screen.
        const activeWidth = worldWidth - (2 * (worldWidth * CONFIG.tracking.stageMarginX));

        return {
            visible: true,
            ghost: s.ghost, // Flag letting main.js know to forcefully fade opacity
            // Math: Translate 0 to 1 into -Width/2 to +Width/2
            x: (normalizedX * activeWidth) - (activeWidth / 2),
            y: s.y * (worldHeight * 0.55),
            scale: s.scale
        };
    }
}