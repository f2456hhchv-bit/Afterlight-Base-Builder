import { STAT_KEYS } from "../core/Crew.js";
import { getModuleType } from "../core/moduleTypes.js";

const STAT_LABELS = { power: "PWR", focus: "FCS", vigor: "VIG", charm: "CHM", science: "SCI", agility: "AGI", luck: "LCK" };

/** DOM-based crew roster — select a card to arm assignment mode, then click a built module in the 3D scene. */
export class CrewPanel {
  constructor(root, { onSelect, onRecall }) {
    this.onSelect = onSelect;
    this.onRecall = onRecall;
    this.selectedCrewId = null;

    this.root = document.createElement("div");
    this.root.className = "panel crew-panel";
    const title = document.createElement("h3");
    title.textContent = "Crew";
    this.root.appendChild(title);

    this.listEl = document.createElement("div");
    this.listEl.className = "crew-list";
    this.root.appendChild(this.listEl);

    root.appendChild(this.root);
  }

  render(station, roster) {
    this.listEl.innerHTML = "";
    for (const member of roster.list()) {
      this.listEl.appendChild(this._buildCard(station, member));
    }
  }

  _buildCard(station, member) {
    const card = document.createElement("div");
    card.className = "crew-card";
    card.dataset.crewId = member.id;
    if (member.id === this.selectedCrewId) card.classList.add("active");

    const header = document.createElement("div");
    header.className = "crew-card-header";
    const name = document.createElement("span");
    name.textContent = member.name;
    header.appendChild(name);

    const assignment = document.createElement("span");
    assignment.className = "crew-assignment";
    if (member.assignedModuleId) {
      const module = station.modules.get(member.assignedModuleId);
      assignment.textContent = module ? getModuleType(module.typeId).name : "Unassigned";
    } else {
      assignment.textContent = "Docked";
    }
    header.appendChild(assignment);
    card.appendChild(header);

    const happiness = document.createElement("div");
    happiness.className = "crew-happiness";
    happiness.textContent = `Morale ${Math.round(member.happiness)}%`;
    card.appendChild(happiness);

    const stats = document.createElement("div");
    stats.className = "crew-stats";
    for (const key of STAT_KEYS) {
      const bar = document.createElement("span");
      bar.className = "stat-chip";
      bar.textContent = `${STAT_LABELS[key]} ${member.stats[key]}`;
      stats.appendChild(bar);
    }
    card.appendChild(stats);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".recall-btn")) return;
      this.selectedCrewId = this.selectedCrewId === member.id ? null : member.id;
      this.onSelect(this.selectedCrewId);
    });

    if (member.assignedModuleId) {
      const recall = document.createElement("button");
      recall.className = "recall-btn";
      recall.textContent = "Recall";
      recall.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onRecall(member.id);
      });
      card.appendChild(recall);
    }

    return card;
  }

  clearSelection() {
    this.selectedCrewId = null;
  }
}
