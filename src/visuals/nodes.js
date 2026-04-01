/*
 * FILE: src/visuals/nodes.js
 * SYSTEM: Visuals / Background
 * RESPONSIBILITY: The interactive background layer. Renders a field of static dots that light up, physically move aside, and draw neural-webs when the singer's halo passes near them. Also handles complex "Organic Transformation" into bioluminescent blobs when a node absorbs enough energy.
 * INTERACTION: Modulated heavily by audioFeatures.js (audio reactivity) and main.js (which passes down the halo positional data for collision).
 * VISUAL RESULT: The entire "world" the singer traverses through. The web connectors create a sense of connectivity, while the energy states simulate a living, reacting environment.
 */

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
    
    // Reveal variables: Only a few nodes are visible when the experience starts.
    // They slowly turn on during the 15-second intro build-up phase.
    this.visibleNodeCount = 0;
    this.revealProgress = 0;
    this.activationProgress = 0;

    this.audio = {
      bass: 0, mids: 0, highs: 0, level: 0, peak: 0,
    };

    // Organized Groups for rendering layering (Web lines go behind nodes, Organic blobs go in front)
    this.nodeGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.organicGroup = new THREE.Group();

    // PERFORMANCE OPTIMIZATION: Object Pooling.
    // Re-creating or deleting thousands of THREE.Line objects every frame completely crashes Chrome.
    // Instead, we create a bucket of lines ONCE, and just hide/unhide and move points on them every frame.
    this.linePool = []; 

    this.scene.add(this.lineGroup);
    this.scene.add(this.organicGroup);
    this.scene.add(this.nodeGroup);

    this.createNodes();
  }

  /**
   * Generates the baseline background scattered dots.
   * This is run ONCE at initialization.
   */
  createNodes() {
    for (let i = 0; i < CONFIG.nodes.count; i++) {
      const baseRadius = CONFIG.nodes.baseRadius * randomRange(0.8, 1.8);

      const geometry = new THREE.CircleGeometry(baseRadius, 24);
      // Small 18% chance for a node to be natively brighter, creating variance.
      const baseColor =
        Math.random() > 0.82 ? CONFIG.colors.nodeBright : CONFIG.colors.node;

      // Start fully invisible (opacity:0), they are "revealed" later.
      const material = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Distribute randomly across the bounded screen coordinate space.
      const x = randomRange(-CONFIG.world.width / 2 + 5, CONFIG.world.width / 2 - 5);
      const y = randomRange(-CONFIG.world.height / 2 + 5, CONFIG.world.height / 2 - 5);

      mesh.position.set(x, y, 0);

      // The core Data Structure for every single background point
      const node = {
        mesh,
        baseRadius,
        baseColor: new THREE.Color(baseColor),
        touchedColor: new THREE.Color(CONFIG.colors.nodeTouched),

        // Base anchors so they don't wander off the screen entirely during drift
        baseX: x,
        baseY: y,
        driftSeedX: Math.random() * 1000,
        driftSeedY: Math.random() * 1000,

        revealed: false,
        state: 0,           // 0=dot, 1=growing biological form, 3=max blooming form
        pulse: 0,           // Temporary brightness flash on touch
        lastTouchTime: -999,
        energy: 0,          // ⚠️ IMPORTANT: Tracks how often the singer rubs against this node. High energy = Transformation.

        organicRotation: (Math.random() - 0.5) * Math.PI,
        organicTiltSeed: Math.random() * 1000,
        activationGlow: 0,
        
        // This vector handles repulsion. Nodes visually push away from each other so they never perfectly overlap.
        visualOffset: new THREE.Vector3(0, 0, 0),

        // Pre-generates the complex biological shapes (hidden by default)
        organic: this.createOrganicVisual(baseRadius),
      };

      this.organicGroup.add(node.organic.group);
      this.nodes.push(node);
      this.nodeGroup.add(mesh);
    }
  }

  /**
   * The heavy bioluminescent "Cocoon" transformation shapes.
   * WHY: Simple dots are boring. When a singer dwells in a spot, the dots evolve into complex, pulsing, jellyfish-like biological splatters representing a high-energy interaction.
   * VISUAL RESULT: Deeply complex organic geometries that flash with musical peaks.
   */
  createOrganicVisual(baseRadius) {
    const group = new THREE.Group();
    group.visible = false;

    const cocoonWidth = baseRadius * (5.0 + Math.random() * 1.8);
    const cocoonHeight = baseRadius * (3.2 + Math.random() * 1.6);

    // Irregular cocoon outline using noise maths so it doesn't look like a perfect circle
    const outlineCount = 56;
    const outlinePoints = [];

    for (let i = 0; i <= outlineCount; i++) {
      const t = (i / outlineCount) * Math.PI * 2;
      const noise1 = Math.sin(t * 2 + Math.random() * 0.2) * 0.1;
      const noise2 = Math.sin(t * 5 + Math.random() * 0.2) * 0.05;
      const noise3 = Math.cos(t * 3 + Math.random() * 0.2) * 0.06;

      const rX = cocoonWidth * (0.48 + noise1 + noise2);
      const rY = cocoonHeight * (0.48 + noise1 + noise3);

      outlinePoints.push(new THREE.Vector3(Math.cos(t) * rX, Math.sin(t) * rY, 0));
    }

    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.colors.nodeBright,
      transparent: true,
      opacity: 0,
    });
    const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
    group.add(outline);

    // Small persistent central core dot
    const coreGeo = new THREE.CircleGeometry(baseRadius * 0.42, 18);
    const coreMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.nodeBright, transparent: true, opacity: 0 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Asymmetrical bright hotspot on one side to give 3D volume
    const hotspotGeo = new THREE.CircleGeometry(baseRadius * 0.22, 16);
    const hotspotMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.nodeTouched, transparent: true, opacity: 0 });
    const hotspot = new THREE.Mesh(hotspotGeo, hotspotMat);
    hotspot.position.set(cocoonWidth * 0.18, baseRadius * 0.05, 0.03);
    group.add(hotspot);

    // Wide glowing aura layer (Additive Blending creates high contrast light blooms)
    const outerGeo = new THREE.RingGeometry(baseRadius * 1.5, baseRadius * 2.2, 32);
    const outerMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.nodeBright, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const outerHalo = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerHalo);

    // Neural tentacles stretching randomly from the center
    const strands = [];
    for (let i = 0; i < 28; i++) {
      const material = new THREE.LineBasicMaterial({ color: CONFIG.colors.nodeBright, transparent: true, opacity: 0 });
      const line = new THREE.Line(new THREE.BufferGeometry(), material);
      group.add(line);

      strands.push({
        line,
        seed: Math.random() * 1000,
        angle: Math.random() * Math.PI * 2,
        targetRadiusScale: 0.55 + Math.random() * 0.35,
        bend: -0.25 + Math.random() * 0.5,
        thicknessBias: Math.random(),
      });
    }

    // Paint splatter style blobs 
    const splashes = [];
    for (let i = 0; i < 5; i++) {
      const splashShape = new THREE.Shape();
      const splashSize = baseRadius * (0.22 + Math.random() * 0.18);

      const pts = 10;
      for (let p = 0; p <= pts; p++) {
        const t = (p / pts) * Math.PI * 2;
        const rr = splashSize * (0.75 + Math.sin(t * 3 + Math.random()) * 0.18 + Math.random() * 0.22);
        const x = Math.cos(t) * rr;
        const y = Math.sin(t) * rr;
        if (p === 0) splashShape.moveTo(x, y);
        else splashShape.lineTo(x, y);
      }

      const mat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.nodeTouched, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(splashShape), mat);
      group.add(mesh);

      splashes.push({
        mesh, seed: Math.random() * 1000,
        xNorm: -0.18 + Math.random() * 0.5,
        yNorm: -0.26 + Math.random() * 0.52,
        rot: Math.random() * Math.PI * 2,
      });
    }

    // Outer faint wisps
    const filaments = [];
    for (let i = 0; i < 6; i++) {
      const material = new THREE.LineBasicMaterial({ color: CONFIG.colors.nodeBright, transparent: true, opacity: 0 });
      const line = new THREE.Line(new THREE.BufferGeometry(), material);
      group.add(line);

      filaments.push({ line, seed: Math.random() * 1000, offset: i / 5 });
    }

    return {
      group, outline, core, hotspot, outerHalo, strands, splashes, filaments, cocoonWidth, cocoonHeight,
    };
  }

  /**
   * Gradually drains the interactive "state" out of nodes.
   * WHY: If nodes didn't decay, simply rubbing the whole screen once would turn the entire background permanently maxed out and visually chaotic.
   * This ensures the environment slowly returns to calm when the singer leaves an area.
   */
  updateEnergyDecay(delta, elapsedTime) {
    const baseDecay = delta * 0.015;
    const delayedDecay = delta * 0.02;

    for (const node of this.nodes) {
      if (!node.revealed) continue;

      let decayRate = baseDecay;
      // Drains heavily if untouched for over 2.5 seconds
      if (elapsedTime - node.lastTouchTime > 2.5) {
        decayRate += delayedDecay;
      }

      node.energy = node.energy || 0;
      node.energy -= decayRate;
      node.energy = Math.max(0, node.energy);

      // Energy directly maps to the `state` integer which drives organic visuals (0, 1, 2, or 3)
      node.state = Math.floor(node.energy * 3);
    }
  }

  /** Central per-frame router. */
  update(delta, elapsedTime, audio) {
    this.audio = audio || this.audio;
    // Build sequence global reveal tracker (Calibration unlocks the progression)
    if (this.activationProgress < 1 && window.isCalibrated) {
        this.activationProgress += delta * 0.08;
    }

    this.updateReveal(delta);
    this.updateDrift(elapsedTime);
    this.updateRepulsion(delta);
    this.updateEnergyDecay(delta, elapsedTime); 
    this.updateVisualState(delta, elapsedTime);
    this.rebuildConnectors(elapsedTime); // Draws the neural web lines

    this.haloPositions = []; // Clear for next frame calculations
  }

  /**
   * Physics: Prevents clumped nodes from overlapping.
   * If they get too close, they subtract push vectors to slide slightly apart smoothly.
   */
  updateRepulsion(delta) {
    // Bleed off the visual offset every frame so they relax back toward their base layout naturally
    for (const node of this.nodes) {
      node.visualOffset.multiplyScalar(0.88);
    }

    // Heavy O(N^2) comparison. This is extremely slow mathematically, which is why node count is kept moderate (~130).
    // It only triggers on High Energy (`state > 0`) nodes to save massive amounts of CPU.
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

  /** Gradually unlocks hidden nodes globally over the 15 second intro phase based on activationProgress */
  updateReveal(delta) {
    this.revealProgress += CONFIG.nodes.revealSpeed * delta;
    const targetVisibleCount = Math.floor(this.nodes.length * this.activationProgress);

    while (this.visibleNodeCount < targetVisibleCount) {
      this.nodes[this.visibleNodeCount].revealed = true;
      this.visibleNodeCount++;
    }

    for (const node of this.nodes) {
      const targetOpacity = node.revealed ? 0.95 : 0;
      node.mesh.material.opacity += (targetOpacity - node.mesh.material.opacity) * 0.08;
    }
  }

  /**
   * AUDIO MAPPING: Drift (Baseline Floating)
   * Nodes wander off their base anchor points via sine waves.
   * If Bass is loud, this distance wildly expands, causing the grid to throb outward.
   */
  updateDrift(elapsedTime) {
    const bassBoost = 1 + (this.audio?.bass || 0) * 2.5;

    for (const node of this.nodes) {
      if (!node.revealed) continue;

      const dx = Math.sin(elapsedTime * 0.9 + node.driftSeedX) * CONFIG.nodes.driftAmount * bassBoost;
      const dy = Math.cos(elapsedTime * 0.7 + node.driftSeedY) * CONFIG.nodes.driftAmount * bassBoost;

      node.mesh.position.x = node.baseX + dx;
      node.mesh.position.y = node.baseY + dy;
    }
  }

  /**
   * Visual switcher: Dims/colors basic dots, calls updateOrganicNode if energy is high enough.
   */
  updateVisualState(delta, elapsedTime) {
    for (const node of this.nodes) {
      if (!node.revealed) continue;

      // Drain the temporary immediate tap pulse.
      node.pulse = Math.max(0, node.pulse - delta * CONFIG.nodes.pulseDecaySpeed);

      if (node.state <= 0) {
        // Base Dot State
        const shimmer = Math.sin(elapsedTime * 2.0 + node.driftSeedX) * 0.03;
        node.mesh.scale.set(1, 1, 1);
        node.mesh.material.color.copy(node.baseColor).lerp(node.touchedColor, Math.max(0, shimmer));
        node.mesh.material.opacity += (node.energy * 0.95 - node.mesh.material.opacity) * 0.08;
      } else {
        // High Energy State: Suppress the base dot so the organic transformation shines
        node.mesh.scale.set(1, 1, 1);
        node.mesh.material.color.copy(node.baseColor);
      }

      this.updateOrganicNode(node, elapsedTime);
    }
  }

  /**
   * Extremely complex visual manipulator for the fully blossomed "Bioluminescent Jellyfish" state.
   * Modulates opacities and flexes beizer curves of tentacles based heavily on audio Highs and Peaks.
   */
  updateOrganicNode(node, elapsedTime) {
    const organic = node.organic;
    const active = node.state > 0 || node.pulse > 0.05;

    organic.group.visible = active;
    if (!active) return;

    node.activationGlow = Math.max(0, node.activationGlow - 0.012);

    organic.group.position.copy(node.mesh.position).add(node.visualOffset);
    organic.group.position.z = 0.5;

    // Derived states
    const life = Math.min(1, node.state * 0.3 + node.pulse * 0.7);
    const growth = Math.min(1, node.state * 0.42 + node.pulse * 0.65);

    organic.group.rotation.z = node.organicRotation + Math.sin(elapsedTime * 0.22 + node.organicTiltSeed) * 0.08;
    organic.group.scale.setScalar(0.9 + node.state * 0.05 + node.pulse * 0.06);

    // Fade the basic dot out entirely
    node.mesh.scale.set(1, 1, 1);
    node.mesh.material.opacity += (0.035 - node.mesh.material.opacity) * 0.12;

    organic.outline.material.opacity = 0.14 + life * 0.24;

    const glowBoost = node.activationGlow * 0.55;
    organic.core.material.opacity = 0.1 + life * 0.14 + glowBoost * 0.25;
    
    // AUDIO MAPPING: High frequencies inject sudden intense light into the organic hotspot (snare strikes).
    const highs = this.audio?.highs || 0;
    organic.hotspot.material.opacity = 0.08 + life * 0.18 + glowBoost * 0.35 + highs * 0.25;

    organic.core.scale.setScalar(1 + Math.sin(elapsedTime * 1.4 + node.driftSeedX) * 0.02 + glowBoost * 0.22);
    organic.hotspot.scale.setScalar(1 + Math.sin(elapsedTime * 1.9 + node.driftSeedY) * 0.03 + glowBoost * 0.3);

    // Additive layer pops dramatically on highs
    organic.outerHalo.material.opacity = (life * 0.1 + glowBoost * 0.25 + highs * 0.35);
    organic.outerHalo.scale.setScalar(1.1 + Math.sin(elapsedTime * 2.0 + node.driftSeedX) * 0.04 + highs * 0.4);

    for (const splash of organic.splashes) {
      splash.mesh.position.set(
        splash.xNorm * organic.cocoonWidth + Math.sin(elapsedTime * 0.35 + splash.seed) * 0.06,
        splash.yNorm * organic.cocoonHeight + Math.cos(elapsedTime * 0.42 + splash.seed) * 0.06,
        0.02,
      );
      splash.mesh.rotation.z = splash.rot + Math.sin(elapsedTime * 0.3 + splash.seed) * 0.08;
      splash.mesh.material.opacity = 0.03 + life * 0.1;
    }

    // Number of active stretching neural lines increases the higher the energy state goes
    const activeStrandCount = Math.min(organic.strands.length, 8 + node.state * 3);

    for (let i = 0; i < organic.strands.length; i++) {
        const strand = organic.strands[i];
        if (i >= activeStrandCount) {
          strand.line.material.opacity = 0;
          continue;
        }

        const angle = strand.angle;
        const maxRx = organic.cocoonWidth * 0.48 * strand.targetRadiusScale;
        const maxRy = organic.cocoonHeight * 0.48 * strand.targetRadiusScale;

        const reach = 0.28 + growth * 0.72;
        const endX = Math.cos(angle) * maxRx * reach;
        const endY = Math.sin(angle) * maxRy * reach;

        // Creates complex organic wiggle using pure math
        const c1x = Math.cos(angle + strand.bend) * maxRx * 0.35 * reach + Math.sin(elapsedTime * 0.7 + strand.seed) * 0.12;
        const c1y = Math.sin(angle - strand.bend) * maxRy * 0.35 * reach + Math.cos(elapsedTime * 0.8 + strand.seed) * 0.12;
        const c2x = Math.cos(angle + strand.bend * 0.5) * maxRx * 0.72 * reach + Math.cos(elapsedTime * 0.6 + strand.seed) * 0.08;
        const c2y = Math.sin(angle - strand.bend * 0.5) * maxRy * 0.72 * reach + Math.sin(elapsedTime * 0.75 + strand.seed) * 0.08;

        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(0, 0, 0.01),
          new THREE.Vector3(c1x, c1y, 0.01),
          new THREE.Vector3(c2x, c2y, 0.01),
          new THREE.Vector3(endX, endY, 0.01),
        );

        strand.line.geometry.setFromPoints(curve.getPoints(16));
        
        // AUDIO MAPPING: Audio Peak (transient strike) causes tentacles to visibly brighten
        const peak = this.audio?.peak || 0;
        strand.line.material.opacity = 0.05 + life * (0.1 + strand.thicknessBias * 0.07) + glowBoost * 0.1 + peak * 0.25;
    }

    for (const filament of organic.filaments) {
        const startX = organic.cocoonWidth * 0.22;
        const startY = (filament.offset - 0.5) * organic.cocoonHeight * 0.42;
        const len = organic.cocoonWidth * (0.22 + filament.offset * 0.12);

        const c1x = startX + len * 0.35;
        const c1y = startY + Math.sin(elapsedTime * 0.6 + filament.seed) * organic.cocoonHeight * 0.07;
        const endX = startX + len;
        const endY = startY + Math.cos(elapsedTime * 0.5 + filament.seed) * organic.cocoonHeight * 0.1;

        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(startX, startY, 0.01),
          new THREE.Vector3(c1x, c1y, 0.01),
          new THREE.Vector3(endX, endY, 0.01),
        );

        filament.line.geometry.setFromPoints(curve.getPoints(12));
        filament.line.material.opacity = 0.05 + life * 0.12;
    }
  }

  /**
   * The explicit bridge between the Singer (Halo) and the Background.
   * Called by main.js passing the active target coordinate of the halo.
   * WHY: Triggers reveals if nodes are hidden. Injects Energy if within collision bounds.
   */
  interactWithCircle(circlePosition, circleRadius, elapsedTime) {
    const effectiveRadius = circleRadius * CONFIG.nodes.touchRadiusBoost;
    const revealRadiusSq = CONFIG.nodes.localRevealRadius * CONFIG.nodes.localRevealRadius;

    this.haloPositions = this.haloPositions || [];
    this.haloPositions.push(circlePosition.clone());

    for (const node of this.nodes) {
      const dx = circlePosition.x - node.mesh.position.x;
      const dy = circlePosition.y - node.mesh.position.y;
      const distSq = dx * dx + dy * dy;

      // Reveal hidden nodes directly near the aura
      if (!node.revealed && distSq < revealRadiusSq) {
        node.revealed = true;
        this.visibleNodeCount = Math.max(this.visibleNodeCount, this.nodes.filter((n) => n.revealed).length);
      }

      if (!node.revealed) continue;

      const collisionThreshold = effectiveRadius + node.baseRadius;

      // Direct physical touch collision detection!
      if (distSq < collisionThreshold * collisionThreshold) {
        const timeSinceLastTouch = elapsedTime - node.lastTouchTime;

        // Ensure we don't spam energy infinitely while standing still. Throttle it.
        if (timeSinceLastTouch > CONFIG.nodes.touchCooldown) {
          node.energy = node.energy || 0;

          // Huge explosion of energy on the very first time modifying a node.
          if (node.state === 0) {
              node.energy += 0.4;
              node.state += 2;
          }

          // Adds state and pulse bumps incrementally.
          node.state += 1.5;
          node.pulse = Math.min(node.pulse + 1.5, 3.0);
          node.activationGlow = 1.0;
          node.lastTouchTime = elapsedTime;
          
          // Max limits energy to 1.0 so we don't overflow logic later.
          node.energy = Math.min(1.0, node.energy + 0.8); 
        }
      }
    }
  }

  /**
   * Constructs the neural web lines connecting active nodes.
   * WHY IS THIS PER FRAME?: Nodes move apart dynamically based on music and repulsion forces. 
   * The lines must mathematically recalculate and bend dynamically to follow the displaced nodes.
   */
  rebuildConnectors(elapsedTime) {
    const mids = this.audio?.mids || 0;
    let activeLineIndex = 0; // Tracks which pool index we are currently on to reuse existing lines.

    // Reset loop so lines aren't duplicated and performance is retained
    for (let k = 0; k < this.visibleNodeCount; k++) {
      if (this.nodes[k]) this.nodes[k].connectCount = 0;
    }

    // Huge double-loop checking distance between all possible node pairings
    for (let i = 0; i < this.visibleNodeCount; i++) {
      const a = this.nodes[i];
      if (!a.revealed) continue;

      for (let j = i + 1; j < this.visibleNodeCount; j++) {
        const b = this.nodes[j];
        if (!b.revealed) continue;

        const dx = a.mesh.position.x - b.mesh.position.x;
        const dy = a.mesh.position.y - b.mesh.position.y;
        const distSq = dx * dx + dy * dy;
        
        // AUDIO MAPPING: During loud sequences (high level), the distance tolerance grows, causing 
        // completely disconnected nodes to suddenly spiderweb together across huge gaps.
        const densityBoost = 1 + (this.audio?.level || 0) * 0.5;
        const maxDist = CONFIG.nodes.lineDistance * densityBoost;

        if (distSq > maxDist * maxDist) continue;

        // FILTER: Node pairs will NOT draw a line unless they have COLLECTIVELY soaked up 0.6 energy.
        // Visual Impact: Prevents the background from being an ugly chaotic web full of lines. Only the "touched" areas form tight networks.
        const energyA = a.energy || 0;
        const energyB = b.energy || 0;
        if (energyA + energyB <= 0.6) continue;

        // CAP: Prevents messy overlapping starbursts by limiting any node to a max of 3 connections.
        if ((a.connectCount || 0) >= 3 || (b.connectCount || 0) >= 3) continue;

        a.connectCount = (a.connectCount || 0) + 1;
        b.connectCount = (b.connectCount || 0) + 1;

        const dist = Math.sqrt(distSq);

        // Bezier curve math. Push the center of the line outward perpendicularly to form a sagging natural curve instead of a rigid straight line.
        const mid = a.mesh.position.clone().add(b.mesh.position).multiplyScalar(0.5);
        const dir = b.mesh.position.clone().sub(a.mesh.position);
        const normal = new THREE.Vector3(-dir.y, dir.x, 0).normalize();

        const curveOffset =
          dist * CONFIG.connectors.curveStrength * Math.sin(elapsedTime * 0.35 + a.driftSeedX + b.driftSeedY);

        const control = mid.add(normal.multiplyScalar(curveOffset));

        const curve = new THREE.QuadraticBezierCurve3(
          a.mesh.position.clone(),
          control,
          b.mesh.position.clone(),
        );

        const points = curve.getPoints(CONFIG.connectors.subdivisions);
        
        // Close nodes = bright lines. Far nodes = dim fading out lines.
        const baseOpacity = (1 - dist / maxDist) * CONFIG.nodes.lineOpacity;

        const energyBoost = Math.min(0.25, (a.pulse + b.pulse) * 0.06 + (a.state + b.state) * 0.015);

        // AUDIO MAPPING: Web lines pulse heavily based on the Mid-frequency band.
        const audioBoost = mids * 0.35;
        const targetOpacity = baseOpacity + energyBoost + audioBoost;

        // Draw from the Pool!
        let line;
        if (activeLineIndex < this.linePool.length) {
          line = this.linePool[activeLineIndex];
          line.geometry.setFromPoints(points);
          line.material.opacity = targetOpacity;
          line.visible = true;
        } else {
          // Add to the pool if we ran out of spare lines
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

    // CRITICAL: Any line objects in the pool that we didn't use this frame MUST be turned invisible,
    // otherwise rigid ghost lines from the previous frame will permanently hang in space.
    for (let k = activeLineIndex; k < this.linePool.length; k++) {
      this.linePool[k].visible = false;
    }
  }
}
