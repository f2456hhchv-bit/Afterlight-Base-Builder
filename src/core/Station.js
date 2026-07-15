import { getModuleType } from "./moduleTypes.js";

export const LEVEL_COLUMNS = 12;
export const MAX_LEVELS = 20;

let nextModuleId = 1;

/**
 * A Level is a single horizontal deck of the station.
 * `excavated` levels can hold modules; un-excavated levels render as raw rock/hull.
 */
function createLevel() {
  return {
    excavated: false,
    cells: new Array(LEVEL_COLUMNS).fill(null), // moduleId or null
  };
}

export class Station {
  constructor() {
    this.levels = [createLevel()];
    this.levels[0].excavated = true; // starting deck
    this.modules = new Map(); // id -> module record
  }

  getLevel(index) {
    while (this.levels.length <= index && this.levels.length < MAX_LEVELS) {
      this.levels.push(createLevel());
    }
    return this.levels[index];
  }

  canExcavate(levelIndex) {
    if (levelIndex < 0 || levelIndex >= MAX_LEVELS) return false;
    if (levelIndex === 0) return false; // starting deck is always excavated
    const level = this.getLevel(levelIndex);
    if (level.excavated) return false;
    const above = this.getLevel(levelIndex - 1);
    return above.excavated;
  }

  excavate(levelIndex) {
    if (!this.canExcavate(levelIndex)) return false;
    this.getLevel(levelIndex).excavated = true;
    return true;
  }

  /** Finds the widest empty span on a level containing `col`, clamped to `width`. */
  findPlacementSpan(levelIndex, col, width) {
    const level = this.getLevel(levelIndex);
    if (!level.excavated) return null;
    if (col < 0 || col >= LEVEL_COLUMNS) return null;
    if (level.cells[col] !== null) return null;

    let start = col;
    while (start > 0 && level.cells[start - 1] === null && col - (start - 1) < width) {
      start--;
    }
    let end = start + width - 1;
    if (end >= LEVEL_COLUMNS) {
      end = LEVEL_COLUMNS - 1;
      start = end - width + 1;
      if (start < 0) return null;
    }
    for (let c = start; c <= end; c++) {
      if (level.cells[c] !== null) return null;
    }
    return { start, width };
  }

  placeModule(levelIndex, col, typeId) {
    const type = getModuleType(typeId);
    const span = this.findPlacementSpan(levelIndex, col, type.width);
    if (!span) return null;

    const id = `m${nextModuleId++}`;
    const module = { id, typeId, level: levelIndex, startCol: span.start, width: type.width };
    this.modules.set(id, module);

    const level = this.getLevel(levelIndex);
    for (let c = span.start; c < span.start + type.width; c++) {
      level.cells[c] = id;
    }
    return module;
  }

  removeModule(id) {
    const module = this.modules.get(id);
    if (!module) return false;
    const level = this.getLevel(module.level);
    for (let c = module.startCol; c < module.startCol + module.width; c++) {
      level.cells[c] = null;
    }
    this.modules.delete(id);
    return true;
  }

  moduleAt(levelIndex, col) {
    const level = this.getLevel(levelIndex);
    const id = level.cells[col];
    return id ? this.modules.get(id) : null;
  }
}
