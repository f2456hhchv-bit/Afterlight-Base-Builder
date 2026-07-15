import * as THREE from "three";
import { LEVEL_COLUMNS } from "../core/Station.js";
import { getModuleType } from "../core/moduleTypes.js";
import { CELL_WIDTH, CELL_DEPTH, LEVEL_HEIGHT, cellCenterX, levelCenterY } from "./layout.js";

const ROCK_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x4a3d2e,
  roughness: 0.9,
  metalness: 0.05,
});

const EMPTY_CELL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x223447,
  roughness: 0.5,
  metalness: 0.4,
});

const EDGE_MATERIAL = new THREE.LineBasicMaterial({ color: 0x000000 });

function addEdges(mesh) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), EDGE_MATERIAL);
  mesh.add(edges);
}

const GHOST_VALID = new THREE.MeshStandardMaterial({
  color: 0x6fe0ff,
  transparent: true,
  opacity: 0.35,
  emissive: 0x2a7d99,
});

const GHOST_INVALID = new THREE.MeshStandardMaterial({
  color: 0xff5050,
  transparent: true,
  opacity: 0.35,
  emissive: 0x992020,
});

function moduleMaterial(typeId) {
  const type = getModuleType(typeId);
  return new THREE.MeshStandardMaterial({
    color: type.color,
    emissive: type.emissive,
    emissiveIntensity: 0.55,
    roughness: 0.4,
    metalness: 0.3,
  });
}

/** Renders a Station's grid state into a Three.js group of boxes. No art assets — placeholder geometry only. */
export class StationRenderer {
  constructor(parentGroup) {
    this.group = new THREE.Group();
    parentGroup.add(this.group);

    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), GHOST_VALID);
    this.ghost.visible = false;
    parentGroup.add(this.ghost);

    // levelIndex -> col -> mesh, so raycast hits can be mapped back to grid coords.
    this.cellMeshes = new Map();
  }

  sync(station) {
    this.group.clear();
    this.cellMeshes.clear();

    const previewCount = Math.min(station.levels.length + 1, 20);

    for (let levelIndex = 0; levelIndex < previewCount; levelIndex++) {
      const level = station.getLevel(levelIndex);
      const y = levelCenterY(levelIndex);
      const rowMeshes = new Map();

      if (!level.excavated) {
        const rock = new THREE.Mesh(
          new THREE.BoxGeometry(LEVEL_COLUMNS * CELL_WIDTH, LEVEL_HEIGHT, CELL_DEPTH),
          ROCK_MATERIAL
        );
        rock.position.set((LEVEL_COLUMNS * CELL_WIDTH) / 2, y, 0);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { kind: "rock", level: levelIndex, col: 0 };
        addEdges(rock);
        this.group.add(rock);
        for (let c = 0; c < LEVEL_COLUMNS; c++) rowMeshes.set(c, rock);
        this.cellMeshes.set(levelIndex, rowMeshes);
        continue;
      }

      for (let col = 0; col < LEVEL_COLUMNS; col++) {
        const moduleId = level.cells[col];
        let mesh;
        if (moduleId) {
          const module = station.modules.get(moduleId);
          // Only draw once per module, at its start column, spanning its full width.
          if (module.startCol !== col) continue;
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(module.width * CELL_WIDTH * 0.94, LEVEL_HEIGHT * 0.9, CELL_DEPTH * 0.92),
            moduleMaterial(module.typeId)
          );
          mesh.position.set(cellCenterX(module.startCol, module.width), y, 0);
          mesh.userData = { kind: "module", level: levelIndex, col: module.startCol, moduleId };
          for (let c = col; c < col + module.width; c++) rowMeshes.set(c, mesh);
        } else {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_WIDTH * 0.92, LEVEL_HEIGHT * 0.85, CELL_DEPTH * 0.85),
            EMPTY_CELL_MATERIAL
          );
          mesh.position.set(cellCenterX(col), y, 0);
          mesh.userData = { kind: "empty", level: levelIndex, col };
          rowMeshes.set(col, mesh);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        addEdges(mesh);
        this.group.add(mesh);
      }
      this.cellMeshes.set(levelIndex, rowMeshes);
    }
  }

  showGhost(levelIndex, startCol, width, valid) {
    this.ghost.geometry.dispose();
    this.ghost.geometry = new THREE.BoxGeometry(width * CELL_WIDTH * 0.94, LEVEL_HEIGHT * 0.95, CELL_DEPTH * 0.98);
    this.ghost.position.set(cellCenterX(startCol, width), levelCenterY(levelIndex), 0);
    this.ghost.material = valid ? GHOST_VALID : GHOST_INVALID;
    this.ghost.visible = true;
  }

  hideGhost() {
    this.ghost.visible = false;
  }

  meshAt(levelIndex, col) {
    return this.cellMeshes.get(levelIndex)?.get(col) ?? null;
  }

  allMeshes() {
    return this.group.children;
  }
}
