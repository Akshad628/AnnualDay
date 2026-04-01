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
