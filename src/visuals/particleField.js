/*
 * FILE: src/visuals/particleField.js
 * SYSTEM: Visuals / Atmosphere
 * RESPONSIBILITY: Renders the ambient environment, including swatches of large light, small drifting dust motes, and the overall base haze.
 * INTERACTION: Receives delta time and audio features from main.js every frame to modulate opacity and drift.
 * VISUAL RESULT: Creates a feeling of depth behind the nodes. The particles sway organically, fading in and out based on the overall volume (level) and bass, giving the empty space a "breathing" sensation.
 */

import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export class ParticleField {
  constructor(scene) {
    this.scene = scene;
    
    // Cached audio features to prevent crashes if the audio system lags behind drawing
    this.audio = {
      bass: 0,
      mids: 0,
      highs: 0,
      level: 0,
      peak: 0,
    };

    // We keep all particles grouped to manage them cleanly in the scene hierarchy
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Arrays to maintain references to update positions/opacities per frame
    this.swatches = [];
    this.dust = [];
    
    // Create a procedural soft blob texture used by particles to avoid external image dependencies
    this.dustTexture = this.createBlobTexture({
      tint: "255,255,255",
      alpha: 0.35,
    });

    // Initialize the three atmospheric layers
    this.createBlueHaze();
    this.createSwatches(); // Large ambient color blobs
    this.createDust();     // Tiny sharp specks
  }

  /**
   * Generates the small floating dust motes overlaying the entire scene.
   * WHY: Provides parallax depth and foreground detail.
   */
  createDust() {
    for (let i = 0; i < CONFIG.dust.count; i++) {
      // 18% of the dust motes are blue, the rest are warm beige
      const isBlue = Math.random() < 0.18;

      const material = new THREE.SpriteMaterial({
        map: this.dustTexture,
        color: isBlue ? 0x8ea6d8 : 0xf2ead0,
        transparent: true,
        opacity: 0,
        depthWrite: false, // Disabling depth write prevents alpha sorting artifacts with the glowing halos
      });

      // Disabling depth tests allows dust to render over/under objects purely based on their initial Z-order.
      material.depthTest = false;

      const sprite = new THREE.Sprite(material);

      // Distribute particles across an area significantly wider than the screen to hide edge wrap-around.
      const worldScale = CONFIG.world.width * 0.12;
      const size = worldScale * randomRange(0.6, 2.2);

      const x = randomRange(-CONFIG.world.width / 2, CONFIG.world.width / 2);
      const y = randomRange(-CONFIG.world.height / 2, CONFIG.world.height / 2);
      // Place dust very close to the camera (-0.4 to -1.2) for strong foreground presence.
      const z = randomRange(-1.2, -0.4);

      sprite.position.set(x, y, z);

      const scaleX = size * randomRange(1.4, 2.8);
      const scaleY = size * randomRange(0.8, 1.8);
      sprite.scale.set(scaleX, scaleY, 1);

      sprite.material.rotation = randomRange(0, Math.PI * 2);

      this.group.add(sprite);

      // Store seeds for procedural Perlin-style noise drift later.
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
    // Deprecated/Alternative soft procedural texture logic
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

  /**
   * Creates a giant, static blue background plane.
   * WHY: Elevates the pure black abyss to a deep, volumetric atmosphere. 
   * It is mapped to audio to suddenly flash the background on loud impacts.
   */
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
    // Push the haze extremely far back physically
    this.haze.position.set(0, 0, -10);

    this.group.add(this.haze);
  }

  createDustTexture() {
    // Second unused texture generation logic.
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0, size / 2, size / 2, size / 2,
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

  /**
   * Procedural generation of a watercolor-like asymmetrical blob on a 2D canvas.
   * Used for both dust and large atmospheric swatches.
   * @param {Object} options Tint color string and max opacity alpha mapping.
   */
  createBlobTexture({ tint = "255,255,255", alpha = 1 }) {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Draw 7 overlapping, off-center radial gradients to form a lumpy cloud/bokeh shape
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

  /**
   * Generates the large, defocused background color fields.
   * WHY: Breaking up the geometric patterns of the Nodes with soft, painterly light sources.
   */
  createSwatches() {
    for (let i = 0; i < CONFIG.particles.count; i++) {
      // 78% chance to be blue, else warm gold. Dominantly a cool-toned background.
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
        depthWrite: false, // Prevents depth-buffer ugly clipping squares
      });

      const sprite = new THREE.Sprite(material);

      const size = randomRange(
        CONFIG.particles.baseSize * 0.8,
        CONFIG.particles.baseSize * 2.4,
      );

      const x = randomRange(-CONFIG.world.width / 2, CONFIG.world.width / 2);
      const y = randomRange(-CONFIG.world.height / 2, CONFIG.world.height / 2);
      // Place in the mid-background layer
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

  /**
   * Main update loop for the atmosphere layer. Called by main.js per frame.
   * @param {number} elapsedTime Time since start in seconds.
   * @param {Object} audio Normalised (0-1) audio features object.
   */
  update(elapsedTime, audio) {
    this.audio = audio || this.audio;

    const level = this.audio?.level || 0;
    const bass = this.audio?.bass || 0;
    const highs = this.audio?.highs || 0;

    // AUDIO MAPPING: Haze opacity
    // Visual Impact: The entire background brightens slightly according to overall volume and bass heavy hits.
    this.haze.material.opacity = Math.min(
      0.26,
      0.14 + level * 0.04 + bass * 0.05,
    );

    // AUDIO MAPPING: Haze scale
    // By growing the background plane slightly on the bass kick, it creates an illusion that the space itself is breathing out.
    const hazeScale = 1 + bass * 0.03;
    this.haze.scale.set(hazeScale, hazeScale, 1);
    this.haze.rotation.z = Math.sin(elapsedTime * 0.02) * 0.03;

    // SWATCH LOOP (Large light blooms)
    for (const swatch of this.swatches) {
      // Procedural drift using sine waves unique to each particle (driftSeed)
      // AUDIO MAPPING: Drift distance multiplies heavily on bass, causing the blobs to physically vibrate apart on kick drums.
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

      // AUDIO MAPPING: Highs create a rapid strobing / flickering effect in the opacity.
      const flicker =
        0.92 +
        0.08 * Math.sin(elapsedTime * 0.25 + swatch.pulseSeed + highs * 2);

      const targetOpacity =
        (swatch.isBlue ? 0.3 : 0.085) + level * 0.025 + bass * 0.02;

      swatch.sprite.material.opacity = Math.min(
        swatch.isBlue ? 0.16 : 0.15, // Cap max opacity to maintain subtlety
        targetOpacity * flicker,
      );

      // Blobs rapidly swell in size during loud passages
      const sizeBoost = 1 + level * 0.05 + bass * 0.05;

      swatch.sprite.scale.set(
        swatch.baseScaleX * sizeBoost,
        swatch.baseScaleY * sizeBoost,
        1,
      );
    }

    // DUST LOOP (Foreground tiny specks)
    for (const mote of this.dust) {
      // Dust drift is more energetic generally, but still boosted heavily by bass.
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

      // Make dust actively rotate (spin slowly)
      mote.sprite.material.rotation =
        Math.sin(elapsedTime * 0.05 + mote.rotSeed) * 0.4;

      const flicker =
        0.9 + 0.1 * Math.sin(elapsedTime * 0.3 + mote.pulseSeed + highs);

      // Dust flashes intensely on High frequencies (like cymbals or "S" sounds in vocals)
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
