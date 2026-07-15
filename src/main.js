import { Station } from "./core/Station.js";
import { Roster } from "./core/Crew.js";
import { SceneManager } from "./render/SceneManager.js";
import { StationRenderer } from "./render/StationRenderer.js";
import { CrewRenderer } from "./render/CrewRenderer.js";
import { InputController } from "./render/InputController.js";
import { ModulePanel } from "./ui/ModulePanel.js";
import { CrewPanel } from "./ui/CrewPanel.js";

const canvas = document.getElementById("scene-canvas");
const uiRoot = document.getElementById("ui-root");

const station = new Station();
const roster = new Roster();
for (let i = 0; i < 3; i++) roster.recruit();

const sceneManager = new SceneManager(canvas);
const stationRenderer = new StationRenderer(sceneManager.stationGroup);
const crewRenderer = new CrewRenderer(sceneManager.stationGroup);

let selectedTypeId = null;
let selectedCrewId = null;

function refreshCrewUI() {
  crewRenderer.sync(station, roster);
  crewPanel.render(station, roster);
}

const modulePanel = new ModulePanel(uiRoot, (typeId) => {
  selectedTypeId = typeId;
  if (typeId) {
    selectedCrewId = null;
    crewPanel.clearSelection();
    crewPanel.render(station, roster);
  }
});

const crewPanel = new CrewPanel(uiRoot, {
  onSelect: (crewId) => {
    selectedCrewId = crewId;
    if (crewId) {
      selectedTypeId = null;
      modulePanel.clearSelection();
    }
    crewPanel.render(station, roster);
  },
  onRecall: (crewId) => {
    roster.unassign(crewId);
    refreshCrewUI();
  },
});

const input = new InputController({
  canvas,
  camera: sceneManager.camera,
  station,
  renderer: stationRenderer,
  roster,
  getSelectedType: () => selectedTypeId,
  getSelectedCrew: () => selectedCrewId,
  onChange: ({ rebuild, crewMoved, message, hover }) => {
    if (rebuild) {
      stationRenderer.sync(station);
      refreshCrewUI();
    }
    if (crewMoved) {
      refreshCrewUI();
    }
    if (message) {
      modulePanel.setStatus(message);
    } else if (hover === null && !rebuild && !crewMoved) {
      modulePanel.setStatus(`Afterlight Station — ${station.modules.size} modules built`);
    }
  },
});

stationRenderer.sync(station);
refreshCrewUI();
sceneManager.onTick((dt) => crewRenderer.update(dt));
sceneManager.start();
