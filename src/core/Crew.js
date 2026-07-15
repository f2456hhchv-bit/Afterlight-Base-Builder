import { getModuleType } from "./moduleTypes.js";

export const STAT_KEYS = ["power", "focus", "vigor", "charm", "science", "agility", "luck"];

const FIRST_NAMES = ["Nova", "Orion", "Vega", "Kai", "Lyra", "Zane", "Astra", "Rhen", "Sol", "Mira"];
const LAST_NAMES = ["Voss", "Kade", "Ren", "Osei", "Marlow", "Iyer", "Bex", "Torin", "Wren", "Halcyon"];

let nextCrewId = 1;

function randomStat() {
  return 1 + Math.floor(Math.random() * 10);
}

function randomStats() {
  const stats = {};
  for (const key of STAT_KEYS) stats[key] = randomStat();
  return stats;
}

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export class CrewMember {
  constructor(name, stats) {
    this.id = `c${nextCrewId++}`;
    this.name = name;
    this.stats = stats;
    this.assignedModuleId = null;
    this.happiness = 60;
  }
}

export class Roster {
  constructor() {
    this.members = new Map();
  }

  recruit(name = randomName(), stats = randomStats()) {
    const member = new CrewMember(name, stats);
    this.members.set(member.id, member);
    return member;
  }

  membersInModule(moduleId) {
    return [...this.members.values()].filter((m) => m.assignedModuleId === moduleId);
  }

  capacityFor(station, moduleId) {
    const module = station.modules.get(moduleId);
    if (!module) return 0;
    return getModuleType(module.typeId).width;
  }

  /** Assigns a crew member to a module, respecting capacity. Reassigns cleanly if already posted elsewhere. */
  assign(station, crewId, moduleId) {
    const member = this.members.get(crewId);
    const module = station.modules.get(moduleId);
    if (!member || !module) return false;
    if (member.assignedModuleId === moduleId) return true;

    const occupants = this.membersInModule(moduleId).length;
    if (occupants >= this.capacityFor(station, moduleId)) return false;

    member.assignedModuleId = moduleId;
    return true;
  }

  unassign(crewId) {
    const member = this.members.get(crewId);
    if (!member) return false;
    member.assignedModuleId = null;
    return true;
  }

  list() {
    return [...this.members.values()];
  }
}
