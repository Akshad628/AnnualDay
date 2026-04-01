/*
 * FILE: src/utils/config.js
 * SYSTEM: Core Configuration
 * RESPONSIBILITY: Centralized configuration hub defining sizes, colors, logic bounds, and physics constants.
 * INTERACTION: Imported by almost every other file (main.js, tracker.js, nodes.js, particleField.js, circleAgent.js).
 * VISUAL RESULT: This file directly dictates the look, feel, spacing, layout, tracking feel, and color palette of the entire experience. Modifying values here immediately changes the visual output safely.
 */

export const CONFIG = {
  // Global background color.
  // Visual Impact: Changes the empty space canvas color. Currently a very dark abyss blue/black.
  backgroundColor: 0x05070a,

  // Determines the frustum bounds for the Orthographic camera in setupScene.js.
  // Visual Impact: Increasing these values makes all objects look smaller (zooming the camera out).
  // Decreasing them zooms in. It effectively scales the "stage" size.
  world: {
    width: 160,
    height: 90,
  },

  nodes: {
    // Number of background reactive nodes.
    // Visual/Perf Impact: Higher = denser field but slower rendering.
    count: 130,

    // The starting size of an un-activated node.
    // Visual Impact: Higher makes the base nodes thicker and more prominent.
    baseRadius: 0.28,

    // Speed at which nodes fade in during the 15-second build-up phase.
    revealSpeed: 0.03,

    // How close two nodes must be to draw a connector line between them.
    // Visual Impact: Higher = more a dense "web" of lines. Lower = sparse, isolated nodes.
    lineDistance: 15,

    // Controls how far nodes wander from their base position over time.
    // Visual Impact: Higher = more chaotic, energetic floating. Lower = static, calm grid-like feel.
    driftAmount: 0.8,

    // Base transparency of the connector lines.
    // Visual Impact: Higher = very solid, bright webs. Lower = subtle, ghostly connections.
    lineOpacity: 0.1,

    // Scale multiplier for how far a halo's influence reaches into the node field.
    // Visual Impact: Higher means the halo wakes up nodes from further away.
    touchRadiusBoost: 1.5,

    // Time in seconds before a node can be re-triggered by a halo.
    // Visual Impact: Higher prevents rapid re-triggering, creating a slower heartbeat effect.
    // Fragile: Too low causes constant max-energy states if tracking stutters.
    touchCooldown: 0.35,

    // How fast the temporary "pulse" energy fades after a halo touches a node.
    // Visual Impact: Higher makes the bright flash fade quickly. Lower creates long glowing trails behind the singer.
    pulseDecaySpeed: 2.0,

    // Distance a halo must be to an invisible node to "reveal" it permanently.
    // Visual Impact: Larger radius reveals the stage faster as the singer moves.
    localRevealRadius: 16,
  },

  colors: {
    // Base color palette. Configured heavily around golden/blue theme.
    node: 0xf4e6a2,         // Standard node color
    nodeBright: 0xfff3c2,   // Flashing/energized color
    nodeTouched: 0xfff0b8,  // Interaction color
    line: 0xf0df9a,         // Web connector color
    circleCore: 0x0a0b10,   // Center of the halo (dark to allow text to stand out)
    circleGlow: 0xf6e7a8,   // Outer atmospheric glow of the halo
    particleGold: 0xf0dfa8, // Warm floating particles
    particleBlue: 0x5b73b3, // Cool floating particles
    hazeBlue: 0x09101f,     // Ambient background hue
  },

  circle: {
    // Base inner radius of the tracking halo.
    // Visual Impact: Controls the size of the dark void around the singer.
    radius: 9,

    // Size of the soft glow extending outward.
    glowRadius: 13,

    // Lerp factor for the halo following the tracker target.
    // Visual Impact: 1.0 = instant snap (jittery). 0.08 = smooth, buttery trailing motion.
    // ⚠️ FRAGILE: Lowering below 0.05 will cause heavy lag behind the singer.
    followLerp: 0.08,
  },

  // Configuration for MediaPipe skeleton tracking and physics smoothing.
  tracking: {
    // Number of people to track. Currently hardcoded to 1 for this specific single-singer setup.
    maxSingers: 1, 

    // General smoothing weight applied during raw landmark extraction.
    smoothing: 0.25, 

    // How many consecutive frames the tracker can lose the singer before fading them out to "Ghost" state.
    maxLostFrames: 90, 

    // Distance from the exact screen edge the halo can travel.
    // Visual Impact: Prevents the halo from getting cut off by the edge of the monitor.
    stageMarginX: 0.1, 

    // Deadzone to prevent tiny vertical shoulder bobs from moving the halo.
    // Visual Impact: Higher creates a strong lock on the Y-axis (shoulder level), completely eliminating nervous jitter.
    verticalDeadzone: 0.05, 

    // Sensitivity multipliers translating human motion into screen coordinate distance.
    verticalMultiplier: 0.6, 
    horizontalMultiplier: 0.6, 

    // Physical boundaries in the camera feed where tracking is valid.
    // Any tracking outside this 20%-80% horizontal range is ignored.
    zoneMinX: 0.2,
    zoneMaxX: 0.8,

    // Physics parameters for the spring system that smooths the target position.
    // Visual Impact: Higher tension = faster snap to new positions. 
    // Higher friction (closer to 1.0) = more sliding/gliding momentum.
    // ⚠️ SENSITIVE: Tight balance between latency and butter-smooth motion.
    springTension: 0.07, 
    springFriction: 0.85, 
    
    // Physics parameters for halo resizing based on singer depth/shoulder width.
    scaleTension: 0.08,
    scaleFriction: 0.85,
    identityThreshold: 0.25
  },

  finale: {
    // Used in previous iterations. Distance between halos to trigger finale automatically.
    mergeDistance: 15.0, 
    holdTime: 3.0 
  },

  // The distinct colors assigned to different tracked individuals.
  // With maxSingers=1, only the first color is actively used.
  singerColors: [
    0xf6e7a8, // Singer 1: Gold/Yellow (Default)
    0xa8f6e7, // Singer 2: Cyan/Teal
    0xe7a8f6  // Singer 3: Purple/Pink
  ],

  organic: {
    // Configuration for the "cocoon" transformation when nodes reach max energy.
    // Controls opacity of the various layers drawn around the node.
    membraneOpacity: 0.18,
    nucleusOpacity: 0.85,
    veinOpacity: 0.35,
    filamentOpacity: 0.45,

    // Scaling bounds for the biological shapes.
    membraneScale: 3.2,
    veinCount: 6,
    filamentCount: 5,
    
    // How much the shapes deform over time (jiggling effect).
    wobble: 0.35,
  },

  connectors: {
    // How much the lines between nodes bend (Bezier curves).
    // Visual Impact: 0 = straight rigid lines. 0.18 = organic, sagging neural-like webs.
    curveStrength: 0.18,
    
    // Number of segments per line. 
    // Performance Note: Decreasing this improves performance but makes curves look jagged.
    subdivisions: 20,
  },
  
  particles: {
    // Configuration for large floating environmental light swatches.
    count: 80,
    baseSize: 18,
    
    // How fast they sway horizontally/vertically.
    driftAmount: 0.18,
    opacity: 0.08,
    
    // Audio reactivity multipliers.
    // Visual Impact: Increasing makes them flash brighter and swell larger on loud sounds.
    audioOpacityBoost: 0.05,
    audioSizeBoost: 0.1,
  },
  
  dust: {
    // Configuration for tiny ambient dust motes overlaying the scene.
    count: 140,
    baseSize: 1,
    opacity: 0.06,
    driftAmount: 0.08,
  },
};