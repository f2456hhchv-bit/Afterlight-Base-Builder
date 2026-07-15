import * as THREE from "three";
import { CELL_WIDTH, CELL_DEPTH, LEVEL_HEIGHT, cellCenterX, levelCenterY } from "./layout.js";

const MOVE_SPEED = 4.5; // world units per second
const DOCK_X = -CELL_WIDTH * 1.4;
const DECK_FLOOR_OFFSET = -(LEVEL_HEIGHT * 0.9) / 2 + 0.05; // stand on the module's floor, not its center
const DOCK_Y = levelCenterY(0) + DECK_FLOOR_OFFSET;
const FRONT_Z = (CELL_DEPTH * 0.92) / 2 + 0.35; // clear of the module box's solid front face

const CREW_PALETTE = [0xffe08a, 0x8aeaff, 0xff9ecf, 0xa8ff9e, 0xc9a9ff, 0xffb08a, 0x9ecfff];

function paletteColor(id) {
  const n = parseInt(id.slice(1), 10);
  return CREW_PALETTE[n % CREW_PALETTE.length];
}

function makeCrewMesh(id) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: paletteColor(id), roughness: 0.5, metalness: 0.2 })
  );
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);
  return group;
}

/** Renders crew members as simple capsules that walk (lerp) between their idle dock and assigned module. */
export class CrewRenderer {
  constructor(parentGroup) {
    this.group = new THREE.Group();
    parentGroup.add(this.group);
    this.entries = new Map(); // id -> { mesh, target: Vector3 }
  }

  _dockPosition(index, total) {
    const z = (index - (total - 1) / 2) * 1.1;
    return new THREE.Vector3(DOCK_X, DOCK_Y, z);
  }

  _modulePosition(station, moduleId, occupantIndex, occupantCount) {
    const module = station.modules.get(moduleId);
    if (!module) return null;
    const baseX = cellCenterX(module.startCol, module.width);
    const spread = Math.min(module.width * CELL_WIDTH * 0.6, 1.6);
    const offset = occupantCount > 1 ? (occupantIndex - (occupantCount - 1) / 2) * (spread / occupantCount) : 0;
    return new THREE.Vector3(baseX + offset, levelCenterY(module.level) + DECK_FLOOR_OFFSET, FRONT_Z);
  }

  /** Recomputes target positions for every crew member; call whenever the roster or assignments change. */
  sync(station, roster) {
    const members = roster.list();
    const idleMembers = members.filter((m) => !m.assignedModuleId);
    const byModule = new Map();
    for (const m of members) {
      if (!m.assignedModuleId) continue;
      if (!byModule.has(m.assignedModuleId)) byModule.set(m.assignedModuleId, []);
      byModule.get(m.assignedModuleId).push(m);
    }

    const seen = new Set();

    idleMembers.forEach((member, i) => {
      const entry = this._entryFor(member.id);
      entry.target.copy(this._dockPosition(i, idleMembers.length));
      seen.add(member.id);
    });

    for (const [moduleId, occupants] of byModule) {
      occupants.forEach((member, i) => {
        const pos = this._modulePosition(station, moduleId, i, occupants.length);
        if (!pos) return;
        const entry = this._entryFor(member.id);
        entry.target.copy(pos);
        seen.add(member.id);
      });
    }

    for (const [id, entry] of this.entries) {
      if (!seen.has(id)) {
        this.group.remove(entry.mesh);
        this.entries.delete(id);
      }
    }
  }

  _entryFor(id) {
    let entry = this.entries.get(id);
    if (!entry) {
      const mesh = makeCrewMesh(id);
      mesh.position.copy(this._dockPosition(0, 1));
      this.group.add(mesh);
      entry = { mesh, target: mesh.position.clone() };
      this.entries.set(id, entry);
    }
    return entry;
  }

  update(dt) {
    const step = MOVE_SPEED * dt;
    for (const { mesh, target } of this.entries.values()) {
      const dist = mesh.position.distanceTo(target);
      if (dist < 1e-3) continue;
      const t = Math.min(1, step / dist);
      mesh.position.lerp(target, t);
      mesh.lookAt(target.x, mesh.position.y, target.z);
    }
  }
}
