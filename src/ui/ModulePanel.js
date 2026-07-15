import { MODULE_TYPES } from "../core/moduleTypes.js";

function colorToCss(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

/** DOM-based build panel — deliberately plain, no art assets yet (that's Block 5). */
export class ModulePanel {
  constructor(root, onSelect) {
    this.onSelect = onSelect;
    this.selectedTypeId = null;

    this.statusEl = this._makeEl("div", "panel", "status-bar");
    this.statusEl.textContent = "Afterlight Station — Deck 1";

    this.hintEl = this._makeEl("div", "panel", "hint-bar");
    this.hintEl.textContent = "Select a module below to build it, or select crew to post them. Click grey rock to excavate the next deck.";

    this.moduleEl = this._makeEl("div", "panel", "module-panel");
    const title = document.createElement("h3");
    title.textContent = "Modules";
    this.moduleEl.appendChild(title);

    this.buttons = new Map();
    for (const type of MODULE_TYPES) {
      const btn = document.createElement("button");
      btn.className = "module-btn";
      btn.innerHTML = `<span class="module-swatch" style="background:${colorToCss(type.color)}"></span>${type.name}`;
      btn.addEventListener("click", () => this._select(type.id));
      this.moduleEl.appendChild(btn);
      this.buttons.set(type.id, btn);
    }

    root.appendChild(this.statusEl);
    root.appendChild(this.hintEl);
    root.appendChild(this.moduleEl);
  }

  _makeEl(tag, ...classes) {
    const el = document.createElement(tag);
    el.className = classes.join(" ");
    return el;
  }

  _select(typeId) {
    this.selectedTypeId = this.selectedTypeId === typeId ? null : typeId;
    for (const [id, btn] of this.buttons) {
      btn.classList.toggle("active", id === this.selectedTypeId);
    }
    this.onSelect(this.selectedTypeId);
  }

  setStatus(text) {
    this.statusEl.textContent = text;
  }

  clearSelection() {
    this.selectedTypeId = null;
    for (const btn of this.buttons.values()) btn.classList.remove("active");
  }
}
