import { getEventType } from "../core/eventTypes.js";
import { getModuleType } from "../core/moduleTypes.js";

/** Lists active station threats; module-scope threats can be resolved once crew are staffed there. */
export class ThreatPanel {
  constructor(root, { onResolve }) {
    this.onResolve = onResolve;

    this.root = document.createElement("div");
    this.root.className = "panel threat-panel";
    const title = document.createElement("h3");
    title.textContent = "Threats";
    this.root.appendChild(title);

    this.listEl = document.createElement("div");
    this.listEl.className = "threat-list";
    this.root.appendChild(this.listEl);

    this.emptyEl = document.createElement("div");
    this.emptyEl.className = "threat-empty";
    this.emptyEl.textContent = "Station nominal.";
    this.root.appendChild(this.emptyEl);

    root.appendChild(this.root);
  }

  render(station, eventManager) {
    this.listEl.innerHTML = "";
    const events = eventManager.list();
    this.emptyEl.style.display = events.length === 0 ? "block" : "none";

    for (const event of events) {
      this.listEl.appendChild(this._buildRow(station, event));
    }
  }

  _buildRow(station, event) {
    const type = getEventType(event.typeId);
    const row = document.createElement("div");
    row.className = "threat-row";

    const header = document.createElement("div");
    header.className = "threat-row-header";
    const name = document.createElement("span");
    name.textContent = type.name;
    header.appendChild(name);

    const target = document.createElement("span");
    target.className = "threat-target";
    if (event.moduleId) {
      const module = station.modules.get(event.moduleId);
      target.textContent = module ? getModuleType(module.typeId).name : "Unknown";
    } else {
      target.textContent = "Station-wide";
    }
    header.appendChild(target);
    row.appendChild(header);

    const desc = document.createElement("div");
    desc.className = "threat-desc";
    desc.textContent = type.description;
    row.appendChild(desc);

    if (type.requiresCrewToResolve) {
      const resolveBtn = document.createElement("button");
      resolveBtn.className = "resolve-btn";
      resolveBtn.textContent = "Resolve";
      resolveBtn.addEventListener("click", () => this.onResolve(event.id));
      row.appendChild(resolveBtn);
    } else {
      const timer = document.createElement("div");
      timer.className = "threat-timer";
      timer.textContent = `Passes in ${Math.max(0, Math.ceil(type.duration - event.age))}s`;
      row.appendChild(timer);
    }

    return row;
  }
}
