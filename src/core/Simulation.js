import { getModuleType } from "./moduleTypes.js";
import { getEventType } from "./eventTypes.js";

const BASE_CAPACITY = 100;
const CONSUMPTION_PER_CREW = { food: 0.5, water: 0.5 };
const HAPPINESS_CONVERGE_RATE = 0.15; // fraction of the gap closed per second

export const RESOURCE_KEYS = ["power", "food", "water"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Owns the station's resource pools and per-crew happiness, and advances them each tick. */
export class Simulation {
  constructor() {
    this.resources = {
      power: { amount: 50, capacity: BASE_CAPACITY },
      food: { amount: 50, capacity: BASE_CAPACITY },
      water: { amount: 50, capacity: BASE_CAPACITY },
    };
  }

  _recomputeCapacities(station) {
    let bonus = 0;
    for (const module of station.modules.values()) {
      const type = getModuleType(module.typeId);
      if (type.capacityBonus) bonus += type.capacityBonus;
    }
    for (const key of RESOURCE_KEYS) {
      this.resources[key].capacity = BASE_CAPACITY + bonus;
    }
  }

  _productionAndUpkeep(station, roster, eventManager) {
    const production = { power: 0, food: 0, water: 0 };
    let powerUpkeep = 0;
    let medbayStaffed = false;

    const stationMultiplier = eventManager
      ? eventManager.stationWideEvents().reduce((m, e) => m * getEventType(e.typeId).productionMultiplier, 1)
      : 1;

    for (const module of station.modules.values()) {
      const type = getModuleType(module.typeId);
      powerUpkeep += type.upkeep ?? 0;

      const moduleEvents = eventManager ? eventManager.eventsForModule(module.id) : [];
      let moduleMultiplier = stationMultiplier;
      for (const event of moduleEvents) {
        const eventType = getEventType(event.typeId);
        moduleMultiplier *= eventType.productionMultiplier;
        powerUpkeep += eventType.extraUpkeep ?? 0;
      }

      const occupants = roster.membersInModule(module.id).length;
      if (type.produces && occupants > 0) {
        production[type.produces.resource] += occupants * type.produces.ratePerCrew * moduleMultiplier;
      }
      if (type.happinessBonusWhenStaffed && occupants > 0) {
        medbayStaffed = true;
      }
    }

    return { production, powerUpkeep, medbayStaffed };
  }

  update(dt, station, roster, eventManager) {
    this._recomputeCapacities(station);
    const { production, powerUpkeep, medbayStaffed } = this._productionAndUpkeep(station, roster, eventManager);
    const population = roster.list().length;

    const net = {
      power: production.power - powerUpkeep,
      food: production.food - population * CONSUMPTION_PER_CREW.food,
      water: production.water - population * CONSUMPTION_PER_CREW.water,
    };

    for (const key of RESOURCE_KEYS) {
      const pool = this.resources[key];
      pool.amount = clamp(pool.amount + net[key] * dt, 0, pool.capacity);
    }

    const crisis = RESOURCE_KEYS.some((key) => this.resources[key].amount <= 0);
    const stationHappinessPenalty = eventManager
      ? eventManager.stationWideEvents().reduce((sum, e) => sum + getEventType(e.typeId).happinessPenalty, 0)
      : 0;

    for (const member of roster.list()) {
      let target = 70;
      target += member.assignedModuleId ? 15 : -10;
      if (crisis) target -= 30;
      if (medbayStaffed) target += 8;
      target += stationHappinessPenalty;
      if (eventManager && member.assignedModuleId) {
        for (const event of eventManager.eventsForModule(member.assignedModuleId)) {
          target += getEventType(event.typeId).happinessPenalty;
        }
      }
      target = clamp(target, 0, 100);
      member.happiness += (target - member.happiness) * HAPPINESS_CONVERGE_RATE * dt;
      member.happiness = clamp(member.happiness, 0, 100);
    }
  }

  averageHappiness(roster) {
    const members = roster.list();
    if (members.length === 0) return 100;
    return members.reduce((sum, m) => sum + m.happiness, 0) / members.length;
  }
}
