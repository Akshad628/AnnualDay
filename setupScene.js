/*
 * FILE: src/scene/setupScene.js
 * SYSTEM: Core / Visuals
 * RESPONSIBILITY: Initializes the Three.js root scene, camera, and renderer. Handles window resizing.
 * INTERACTION: Called once at startup by main.js. Returns the core rendering objects.
 * VISUAL RESULT: Establishes a 2D-style flat projection (OrthographicCamera). 
 * This flattens 3D positions so elements scale uniformly without perspective distortion, which is essential for placing the halo directly over the 2D video feed logically.
 */

import * as THREE from "three";
import { CONFIG } from "../utils/config.js";

/**
 * Bootstraps the Three.js environment.
 * WHY: Abstracting this out keeps main.js clean.
 * @returns {Object} { scene, camera, renderer }
 */
export function setupScene() {
  const scene = new THREE.Scene();
  // Set the void background color from config.
  scene.background = new THREE.Color(CONFIG.backgroundColor);

  // Setup Orthographic Camera
  // Using orthographic instead of perspective ensures that depth (Z-axis) 
  // determines render order (layering) but does NOT make objects look smaller 
  // organically. We want absolute manual control over scale.
  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = CONFIG.world.height;
  const frustumWidth = frustumHeight * aspect;

  const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2, // Left
    frustumWidth / 2,  // Right
    frustumHeight / 2, // Top
    -frustumHeight / 2,// Bottom
    0.1,               // Near plane
    1000,              // Far plane
  );

  // Pull camera back to see everything at Z=0.
  camera.position.z = 100;

  // Setup Renderer
  // Antialiasing makes the sharp circular edges of the halos look smooth.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Using a pixel ratio of 1 prevents retina displays from halving the performance.
  renderer.setPixelRatio(1);
  
  // Attach to the DOM
  const app = document.getElementById("app");
  app.appendChild(renderer.domElement);

  // Handle Resizing
  // WHY: Without this, resizing the window stretches the graphics. 
  // SIDE EFFECT: Dynamically updates the Orthographic bounds so circles remain perfectly round.
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
