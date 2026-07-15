const RESOURCE_META = {
  power: { label: "Power", color: "#ffb020" },
  food: { label: "Food", color: "#4ad66d" },
  water: { label: "Water", color: "#3fa9f5" },
};

function happinessColor(pct) {
  if (pct >= 60) return "#4ad66d";
  if (pct >= 30) return "#ffb020";
  return "#ff5050";
}

/** Top-center HUD: live power/food/water meters plus average crew happiness. */
export class ResourceBar {
  constructor(root) {
    this.root = document.createElement("div");
    this.root.className = "panel resource-bar";

    this.meters = {};
    for (const key of Object.keys(RESOURCE_META)) {
      const meta = RESOURCE_META[key];
      const meter = document.createElement("div");
      meter.className = "resource-meter";

      const label = document.createElement("span");
      label.className = "resource-label";
      label.textContent = meta.label;

      const track = document.createElement("div");
      track.className = "resource-track";
      const fill = document.createElement("div");
      fill.className = "resource-fill";
      fill.style.background = meta.color;
      track.appendChild(fill);

      const value = document.createElement("span");
      value.className = "resource-value";

      meter.append(label, track, value);
      this.root.appendChild(meter);
      this.meters[key] = { fill, value, track };
    }

    this.happinessEl = document.createElement("div");
    this.happinessEl.className = "happiness-readout";
    this.root.appendChild(this.happinessEl);

    root.appendChild(this.root);
  }

  render(simulation, roster) {
    for (const key of Object.keys(RESOURCE_META)) {
      const pool = simulation.resources[key];
      const pct = pool.capacity > 0 ? (pool.amount / pool.capacity) * 100 : 0;
      const { fill, value, track } = this.meters[key];
      fill.style.width = `${clamp01(pct)}%`;
      value.textContent = `${Math.round(pool.amount)}/${pool.capacity}`;
      track.classList.toggle("critical", pool.amount <= 0);
    }

    const happiness = simulation.averageHappiness(roster);
    this.happinessEl.textContent = `Crew Morale: ${Math.round(happiness)}%`;
    this.happinessEl.style.color = happinessColor(happiness);
  }
}

function clamp01(pct) {
  return Math.max(0, Math.min(100, pct));
}
