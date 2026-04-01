/*
 * FILE: src/visuals/circleAgent.js
 * SYSTEM: Visuals / Subjects
 * RESPONSIBILITY: Draws and manages the "Halo" that physically tracks the singer's body in the scene. Also renders the rotating conceptual text inside the halo.
 * INTERACTION: Instantiated and updated by main.js, which feeds it physical (X/Y) coordinates from tracker.js. `nodes.js` reads its position to trigger interactive web ripples.
 * VISUAL RESULT: The prominent glowing rings and floating text defining the "aura" around the performer.
 */

import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

export class CircleAgent {
  constructor(scene) {
    this.scene = scene;

    // All layers of the halo are bound to this single group so they move and scale as one cohesive unit.
    this.group = new THREE.Group();

    // LAYER 1: The soft outer ambient glow
    // Visual Impact: Blends the sharp edges of the halo into the background void.
    const glowGeometry = new THREE.CircleGeometry(CONFIG.circle.glowRadius, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.circleGlow,
      transparent: true,
      opacity: 0.12,
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);

    // LAYER 2: The solid inner core
    // Visual Impact: Acts as a dark, isolating backdrop so the white text is readable against the bright background webs.
    const coreGeometry = new THREE.CircleGeometry(CONFIG.circle.radius, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.colors.circleCore,
      transparent: true,
      opacity: 0.96,
    });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);

    // LAYER 3: The sharp outlining ring
    // Visual Impact: Defines the crisp boundary of the singer's conceptual "space".
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

    // --- TEXT RENDERING SYSTEM ---
    // WHY HTML5 Canvas?: Three.js cannot natively render crisp dynamic Text without heavily importing external fonts.
    // By drawing text onto a 2D HTML Canvas, we can convert it into a texture map and slap it onto a 3D Sprite.
    // This provides perfect, crisp typographic control (boldness, strokes, glows) natively.
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 1024; // High resolution for crisp text
    this.textCanvas.height = 512;
    this.textCtx = this.textCanvas.getContext('2d');
    this.textTexture = new THREE.CanvasTexture(this.textCanvas);

    const textMaterial = new THREE.SpriteMaterial({
      map: this.textTexture,
      transparent: true,
      opacity: 0.9,
    });
    this.textSprite = new THREE.Sprite(textMaterial);

    // Base dimensions for the text sprite mapped to the halo's size
    this.baseTextWidth = CONFIG.circle.radius * 1.8;
    this.baseTextHeight = this.baseTextWidth * 0.5;

    this.textSprite.scale.set(
      this.baseTextWidth,
      this.baseTextHeight,
      1
    );
    // Push the text slightly forward in Z-space so it never clips into the core
    this.textSprite.position.set(0, 0, 3); 
    this.textSprite.center.set(0.5, 0.5);

    // Assemble the full object
    this.group.add(this.glow);
    this.group.add(this.core);
    this.group.add(this.ring);
    this.group.add(this.textSprite);

    // ⚠️ SENSITIVE OVERRIDES for GHOST FADE-OUT
    // When tracking loses a singer, opacity drops. We keep the "default" stored
    // so we know exactly what value to restore them to when they reconnect.
    // If these are lost, reconnecting singers snap to 100% solid opacity (bug).
    this.defaultTextOpacity = 0.9;
    this.defaultCoreOpacity = 0.96;
    this.defaultGlowOpacity = 0.12;
    this.defaultRingOpacity = 0.45;

    // Start pulled slightly toward the camera (Z=2) so it floats above background nodes.
    this.group.position.set(0, 0, 2);

    this.currentPosition = new THREE.Vector3(0, 0, 2);
    this.targetPosition = new THREE.Vector3(0, 0, 2);
    
    // Smooth fade-in progress (0 to 1) when the halo first appears out of nowhere
    this.appearProgress = 0;
    this.lockScale = false;

    this.scene.add(this.group);
  }

  /**
   * Translates a string value into drawn pixels on the 3D texture.
   * This is called by main.js every 3-5 seconds to cycle standard words, 
   * and forced to "YOU ARE THE WORLD" during the finale.
   * @param {string} word The word to paint into the halo.
   */
  setWord(word) {
    const ctx = this.textCtx;
    const width = this.textCanvas.width;
    const height = this.textCanvas.height;

    // Clear previous drawing
    ctx.clearRect(0, 0, width, height);

    if (!word) {
      this.textTexture.needsUpdate = true;
      return;
    }

    const lines = word.toUpperCase().split("\n");

    let fontSize = 140; // Extremely large base font for crisp downscaling

    // AUTO-SCALING ALGORITHM:
    // This loop shrinking the font size ensures that extremely long words (like "EMOTIONS") 
    // never overflow outside the black core of the halo.
    do {
      ctx.font = `900 ${fontSize}px Arial Black, Impact, sans-serif`;
      const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
      if (widest <= this.textCanvas.width * 0.65) break; // Fit within 65% of the sprite width
      fontSize -= 4; // Step down until it fits
    } while (fontSize > 40);

    // TYPOGRAPHIC STYLE
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Adds a soft white glow behind the text 
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 18;

    // Adds a thick black stroke. 
    // Visual Impact: Enforces high readability even if the text passes over bright white background nodes.
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineJoin = "round";

    const lineHeight = fontSize * 1.1;
    const totalHeight = lines.length * lineHeight;

    lines.forEach((line, i) => {
      // Vertically center everything perfectly
      const y = this.textCanvas.height / 2
        - totalHeight * 0.45
        + i * lineHeight
        + lineHeight / 2;

      ctx.strokeText(line, this.textCanvas.width / 2, y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, this.textCanvas.width / 2, y);
    });

    // Notify Three.js to push the newly painted pixels to the GPU
    this.textTexture.needsUpdate = true;
  }

  /**
   * Called every frame. Lerps the halo toward the tracker target and applies internal breathing animations.
   * @param {THREE.Vector3} targetWorld Desired location based on camera tracking.
   * @param {number} elapsedTime 
   */
  update(targetWorld, elapsedTime) {
    this.targetPosition.set(targetWorld.x, targetWorld.y, 2);

    // POSITION SMOOTHING (LERP)
    // Moves the halo a percentage (CONFIG.followLerp) of the distance to the target each frame.
    // This creates an intentional, heavy, velvety drag on the tracking.
    this.currentPosition.lerp(this.targetPosition, CONFIG.circle.followLerp);
    this.group.position.copy(this.currentPosition);

    // HALO SCALING OVERRIDE
    // The tracker expands the whole `group` scale when a singer gets close to the camera.
    // However, if the text scales linearly with the halo, the text gets terrifyingly massive.
    // This partial compensation shrinks the *text sprite* inversely as the *halo* grows,
    // ensuring the text stays beautifully proportioned inside the circle regardless of depth.
    const haloScale = this.group.scale.x;
    const correctedScale = 1 / Math.pow(haloScale, 0.6);

    this.textSprite.scale.set(
      this.baseTextWidth * correctedScale,
      this.baseTextHeight * correctedScale,
      1
    );

    // INTRO ANIMATION: Smooth ramp up from invisible to visible.
    if (this.appearProgress < 1) {
        this.appearProgress += 0.03;
    }
    const visualScale = this.appearProgress;

    // IDLE BREATHING SINE WAVES
    // Visual Impact: Gives the circles continuous life even when the singer stands perfectly still.
    const pulse = 1 + Math.sin(elapsedTime * 1.6) * 0.02;
    this.glow.scale.setScalar(pulse);

    const baseRingOpacity = 0.38 + Math.sin(elapsedTime * 2.2) * 0.07;
    const baseGlowOpacity = 0.1 + Math.sin(elapsedTime * 1.4) * 0.025;

    // Apply the pulsating sine waves combined with the global appearProgress fade-in multiplier
    this.ring.material.opacity = baseRingOpacity * visualScale;
    this.glow.material.opacity = baseGlowOpacity * visualScale;
    this.core.material.opacity = (this.defaultCoreOpacity || 0.96) * visualScale;
  }
}
