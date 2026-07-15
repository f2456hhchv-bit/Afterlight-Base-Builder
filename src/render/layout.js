// Shared 3D layout constants so the renderer and the input raycaster agree on
// where each grid cell actually sits in world space.
export const CELL_WIDTH = 2.2;
export const CELL_DEPTH = 2.0;
export const LEVEL_HEIGHT = 1.9;
export const LEVEL_GAP = 0.15;

export function cellCenterX(col, colSpan = 1) {
  return (col + colSpan / 2) * CELL_WIDTH;
}

export function levelCenterY(levelIndex) {
  return -(levelIndex * (LEVEL_HEIGHT + LEVEL_GAP)) - LEVEL_HEIGHT / 2;
}
