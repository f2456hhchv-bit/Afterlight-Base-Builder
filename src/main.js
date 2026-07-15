import { Station } from "./core/Station.js";
import { SceneManager } from "./render/SceneManager.js";
import { StationRenderer } from "./render/StationRenderer.js";
import { InputController } from "./render/InputController.js";
import { ModulePanel } from "./ui/ModulePanel.js";

const canvas = document.getElementById("scene-canvas");
const uiRoot = document.getElementById("ui-root");

const station = new Station();
const sceneManager = new SceneManager(canvas);
const stationRenderer = new StationRenderer(sceneManager.stationGroup);

let selectedTypeId = null;
const panel = new ModulePanel(uiRoot, (typeId) => {
  selectedTypeId = typeId;
});

const input = new InputController({
  canvas,
  camera: sceneManager.camera,
  station,
  renderer: stationRenderer,
  getSelectedType: () => selectedTypeId,
  onChange: ({ rebuild, message, hover }) => {
    if (rebuild) {
      stationRenderer.sync(station);
    }
    if (message) {
      panel.setStatus(message);
    } else if (hover === null && !rebuild) {
      panel.setStatus(`Afterlight Station — ${station.modules.size} modules built`);
    }
  },
});

stationRenderer.sync(station);
sceneManager.start();
