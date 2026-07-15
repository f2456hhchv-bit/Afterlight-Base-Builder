import * as THREE from "three";
import { getModuleType } from "../core/moduleTypes.js";
import { LEVEL_COLUMNS } from "../core/Station.js";

export class InputController {
  constructor({ canvas, camera, station, renderer, onChange, getSelectedType }) {
    this.canvas = canvas;
    this.camera = camera;
    this.station = station;
    this.renderer = renderer;
    this.onChange = onChange;
    this.getSelectedType = getSelectedType;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hovered = null; // { level, col, kind }

    canvas.addEventListener("pointermove", (e) => this._onPointerMove(e));
    canvas.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    canvas.addEventListener("pointerleave", () => this._clearHover());
  }

  _updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _pick(event) {
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.renderer.allMeshes(), false);
    return hits.length > 0 ? hits[0].object.userData : null;
  }

  _onPointerMove(event) {
    const hit = this._pick(event);
    if (!hit) {
      this._clearHover();
      return;
    }
    this.hovered = hit;

    if (hit.kind === "rock") {
      if (this.station.canExcavate(hit.level)) {
        this.renderer.showGhost(hit.level, 0, LEVEL_COLUMNS, true);
      } else {
        this.renderer.hideGhost();
      }
      this.onChange({ hover: { ...hit, canExcavate: this.station.canExcavate(hit.level) } });
      return;
    }

    const selectedTypeId = this.getSelectedType();
    if (selectedTypeId && (hit.kind === "empty" || hit.kind === "module")) {
      const type = getModuleType(selectedTypeId);
      const span = this.station.findPlacementSpan(hit.level, hit.col, type.width);
      if (span) {
        this.renderer.showGhost(hit.level, span.start, span.width, true);
      } else {
        this.renderer.showGhost(hit.level, hit.col, type.width, false);
      }
    } else {
      this.renderer.hideGhost();
    }
    this.onChange({ hover: hit });
  }

  _onPointerDown(event) {
    const hit = this._pick(event);
    if (!hit) return;

    if (hit.kind === "rock") {
      if (this.station.excavate(hit.level)) {
        this.onChange({ rebuild: true, message: `Excavated deck ${hit.level + 1}.` });
      }
      return;
    }

    const selectedTypeId = this.getSelectedType();
    if (!selectedTypeId) return;
    const module = this.station.placeModule(hit.level, hit.col, selectedTypeId);
    if (module) {
      const type = getModuleType(selectedTypeId);
      this.onChange({ rebuild: true, message: `Built ${type.name} on deck ${hit.level + 1}.` });
    }
  }

  _clearHover() {
    this.hovered = null;
    this.renderer.hideGhost();
    this.onChange({ hover: null });
  }
}
