// scope: "module" events target one built module; "station" events apply to the whole base.
// productionMultiplier scales that module's (or every module's) output while active.
// extraUpkeep is added to station-wide power draw while active.
// happinessPenalty is added to the target crew's happiness formula while active.
// requiresCrewToResolve: a crew member must be staffed in the affected module to click-resolve it.
// duration: station-scope events auto-expire after this many seconds; module-scope events need resolving.
// spreadAfter: module-scope events that go unresolved this long spawn a copy on another built module.
export const EVENT_TYPES = [
  {
    id: "hull_breach",
    name: "Hull Breach",
    scope: "module",
    productionMultiplier: 0,
    extraUpkeep: 1.5,
    happinessPenalty: -20,
    requiresCrewToResolve: true,
    description: "Pressure loss — production halted until sealed.",
  },
  {
    id: "raider_boarding",
    name: "Raider Boarding",
    scope: "module",
    productionMultiplier: 0,
    extraUpkeep: 0,
    happinessPenalty: -25,
    requiresCrewToResolve: true,
    description: "Hostiles aboard — crew must repel them.",
  },
  {
    id: "alien_infestation",
    name: "Alien Infestation",
    scope: "module",
    productionMultiplier: 0.3,
    extraUpkeep: 0,
    happinessPenalty: -15,
    requiresCrewToResolve: true,
    spreadAfter: 25,
    description: "Spreading organism — will infest another module if ignored.",
  },
  {
    id: "radiation_storm",
    name: "Radiation Storm",
    scope: "station",
    productionMultiplier: 0.5,
    extraUpkeep: 0,
    happinessPenalty: -5,
    requiresCrewToResolve: false,
    duration: 20,
    description: "Station-wide radiation surge — passes on its own.",
  },
];

export function getEventType(id) {
  const type = EVENT_TYPES.find((t) => t.id === id);
  if (!type) throw new Error(`Unknown event type: ${id}`);
  return type;
}

export const MODULE_EVENT_TYPES = EVENT_TYPES.filter((t) => t.scope === "module");
export const STATION_EVENT_TYPES = EVENT_TYPES.filter((t) => t.scope === "station");
