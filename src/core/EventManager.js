import { MODULE_EVENT_TYPES, STATION_EVENT_TYPES, getEventType } from "./eventTypes.js";

const MIN_SPAWN_INTERVAL = 20;
const MAX_SPAWN_INTERVAL = 40;

let nextEventId = 1;

function randomInterval() {
  return MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
}

/** Spawns and tracks active station threats: module hazards (crew-resolved) and station-wide events (auto-expire). */
export class EventManager {
  constructor() {
    this.active = new Map(); // id -> { typeId, moduleId, age }
    this.spawnTimer = randomInterval();
  }

  update(dt, station) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = randomInterval();
      this._trySpawn(station);
    }

    for (const [id, event] of this.active) {
      event.age += dt;
      const type = getEventType(event.typeId);

      if (type.scope === "station" && event.age >= type.duration) {
        this.active.delete(id);
        continue;
      }

      if (type.spreadAfter && !event.spread && event.age >= type.spreadAfter) {
        event.spread = true;
        this._spread(station, event);
      }
    }
  }

  _trySpawn(station) {
    const builtModules = [...station.modules.values()];
    const canModuleEvent = builtModules.some((m) => !this._moduleHasEvent(m.id));
    const pool = canModuleEvent ? [...MODULE_EVENT_TYPES, ...STATION_EVENT_TYPES] : STATION_EVENT_TYPES;
    if (pool.length === 0) return;

    const type = pool[Math.floor(Math.random() * pool.length)];
    if (type.scope === "station") {
      this._addEvent(type.id, null);
      return;
    }

    const candidates = builtModules.filter((m) => !this._moduleHasEvent(m.id));
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    this._addEvent(type.id, target.id);
  }

  _spread(station, sourceEvent) {
    const candidates = [...station.modules.values()].filter(
      (m) => m.id !== sourceEvent.moduleId && !this._moduleHasEvent(m.id)
    );
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    this._addEvent(sourceEvent.typeId, target.id);
  }

  _addEvent(typeId, moduleId) {
    const id = `ev${nextEventId++}`;
    this.active.set(id, { id, typeId, moduleId, age: 0, spread: false });
    return id;
  }

  _moduleHasEvent(moduleId) {
    return [...this.active.values()].some((e) => e.moduleId === moduleId);
  }

  eventsForModule(moduleId) {
    return [...this.active.values()].filter((e) => e.moduleId === moduleId);
  }

  stationWideEvents() {
    return [...this.active.values()].filter((e) => e.moduleId === null);
  }

  list() {
    return [...this.active.values()];
  }

  /** Resolves a module-scope event if it's crew-resolvable and staffed; returns { ok, message }. */
  resolve(eventId, roster) {
    const event = this.active.get(eventId);
    if (!event) return { ok: false, message: "That threat is already gone." };
    const type = getEventType(event.typeId);
    if (type.requiresCrewToResolve) {
      const staffed = roster.membersInModule(event.moduleId).length > 0;
      if (!staffed) return { ok: false, message: "Assign crew there before you can resolve it." };
    }
    this.active.delete(eventId);
    return { ok: true, message: `${type.name} resolved.` };
  }
}
