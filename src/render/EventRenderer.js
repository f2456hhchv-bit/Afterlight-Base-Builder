import * as THREE from "three";
import { LEVEL_HEIGHT, cellCenterX, levelCenterY } from "./layout.js";

const HAZARD_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xff3b3b,
  emissive: 0xff2020,
  emissiveIntensity: 1,
  roughness: 0.3,
});

const HOVER_CLEARANCE = (LEVEL_HEIGHT * 0.9) / 2 + 0.5;

/** Renders a pulsing hazard marker above any module with an active event. Station-wide events show in the UI only. */
export class EventRenderer {
  constructor(parentGroup) {
    this.group = new THREE.Group();
    parentGroup.add(this.group);
    this.markers = new Map(); // eventId -> mesh
    this._elapsed = 0;
  }

  sync(station, eventManager) {
    const activeModuleEventIds = new Set();

    for (const event of eventManager.list()) {
      if (!event.moduleId) continue;
      activeModuleEventIds.add(event.id);
      if (this.markers.has(event.id)) continue;

      const module = station.modules.get(event.moduleId);
      if (!module) continue;

      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), HAZARD_MATERIAL);
      mesh.position.set(cellCenterX(module.startCol, module.width), levelCenterY(module.level) + HOVER_CLEARANCE, 0.5);
      this.group.add(mesh);
      this.markers.set(event.id, mesh);
    }

    for (const [id, mesh] of this.markers) {
      if (!activeModuleEventIds.has(id)) {
        this.group.remove(mesh);
        this.markers.delete(id);
      }
    }
  }

  update(dt) {
    this._elapsed += dt;
    const pulse = 1 + Math.sin(this._elapsed * 4) * 0.25;
    for (const mesh of this.markers.values()) {
      mesh.scale.setScalar(pulse);
      mesh.rotation.y += dt * 1.5;
    }
  }
}
