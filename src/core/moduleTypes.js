// upkeep: power/sec drawn just for being built (every module needs life support/lighting).
// produces: a resource pool this module generates per second, per crew member staffed there.
export const MODULE_TYPES = [
  {
    id: "reactor",
    name: "Reactor",
    category: "power",
    width: 2,
    color: 0xffb020,
    emissive: 0xff8800,
    upkeep: 0,
    produces: { resource: "power", ratePerCrew: 3.5 },
  },
  {
    id: "hydroponics",
    name: "Hydroponics Bay",
    category: "food",
    width: 2,
    color: 0x4ad66d,
    emissive: 0x2f8f4a,
    upkeep: 0.6,
    produces: { resource: "food", ratePerCrew: 3 },
  },
  {
    id: "reclaimer",
    name: "Water Reclaimer",
    category: "water",
    width: 2,
    color: 0x3fa9f5,
    emissive: 0x1f6fb0,
    upkeep: 0.6,
    produces: { resource: "water", ratePerCrew: 3 },
  },
  {
    id: "quarters",
    name: "Crew Quarters",
    category: "living",
    width: 3,
    color: 0xc9a9ff,
    emissive: 0x7a4fc9,
    upkeep: 0.4,
  },
  {
    id: "medbay",
    name: "Med Bay",
    category: "medical",
    width: 2,
    color: 0xff6b81,
    emissive: 0xc72c47,
    upkeep: 0.5,
    happinessBonusWhenStaffed: 8,
  },
  {
    id: "storage",
    name: "Cargo Storage",
    category: "storage",
    width: 3,
    color: 0x9aa5b1,
    emissive: 0x4a5561,
    upkeep: 0.3,
    capacityBonus: 40, // added to every resource pool's max, just by being built
  },
];

export function getModuleType(id) {
  const type = MODULE_TYPES.find((t) => t.id === id);
  if (!type) throw new Error(`Unknown module type: ${id}`);
  return type;
}
