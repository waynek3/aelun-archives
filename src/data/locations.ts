// Neighborhood and location data.
// Central source of truth for all location IDs, display names, neighborhood mapping,
// and flavor text. No game logic here — pure static data.

import type { NeighborhoodId, LocationId, GodId } from '../state/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocationType = 'tower' | 'bodega' | 'temple' | 'furniture_store' | 'university'
  | 'university_bookstore'   // Sprint 16
  | 'spell_scroll_store';    // Sprint 16

export interface NeighborhoodData {
  id: NeighborhoodId;
  name: string;
  flavor: string;
}

export interface LocationData {
  id: LocationId;
  neighborhood: NeighborhoodId;
  type: LocationType;
  displayName: string;
  godId?: GodId;  // Sprint 9: which god this temple is dedicated to
}

// ─── Neighborhood Table ───────────────────────────────────────────────────────

export const NEIGHBORHOODS: NeighborhoodData[] = [
  { id: 'the_skids',          name: 'The Skids',          flavor: 'Where the real ones live.' },
  { id: 'the_burbs',          name: 'The Burbs',           flavor: 'Pristine lawns. Suspicious smiles.' },
  { id: 'richville',          name: 'Richville',           flavor: 'Old money. Disappointed looks.' },
  { id: 'center_city',        name: 'Center City',         flavor: 'Overpriced coffee. Film crews.' },
  { id: 'downtown',           name: 'Downtown',            flavor: 'Brutalist towers. Pigeons. Never sleeps.' },
  { id: 'university_heights', name: 'University Heights',  flavor: "Incredible pizza. Someone's always moving a couch." },
];

// ─── Location Table ───────────────────────────────────────────────────────────

export const LOCATIONS: LocationData[] = [
  { id: 'tower',                       neighborhood: 'the_skids',          type: 'tower',  displayName: "WIZARD'S TOWER" },
  { id: 'the_skids_bodega',            neighborhood: 'the_skids',          type: 'bodega', displayName: 'LUCKY STAR BODEGA' },
  { id: 'the_burbs_bodega',            neighborhood: 'the_burbs',          type: 'bodega', displayName: 'KWIK STOP' },
  { id: 'richville_bodega',            neighborhood: 'richville',          type: 'bodega', displayName: 'PRESTIGE FUEL & SUNDRIES' },
  { id: 'center_city_bodega',          neighborhood: 'center_city',        type: 'bodega', displayName: 'CORNER MARKET' },
  { id: 'downtown_bodega',             neighborhood: 'downtown',           type: 'bodega', displayName: '24/7 FUEL STOP' },
  { id: 'university_heights_bodega',   neighborhood: 'university_heights', type: 'bodega', displayName: 'STUDENT MART' },
  // Sprint 9: Temples
  { id: 'the_skids_temple_gul',            neighborhood: 'the_skids',          type: 'temple', displayName: 'SHRINE OF GUL',        godId: 'gul' },
  { id: 'the_skids_temple_finhorn',        neighborhood: 'the_skids',          type: 'temple', displayName: "FINHORN'S CHAPEL",      godId: 'finhorn' },
  { id: 'the_burbs_temple_klossa',         neighborhood: 'the_burbs',          type: 'temple', displayName: "KLOSSA'S BURROW",       godId: 'klossa' },
  { id: 'the_burbs_temple_ara',            neighborhood: 'the_burbs',          type: 'temple', displayName: "ARA'S GARDEN",          godId: 'ara' },
  { id: 'richville_temple_skarhol',        neighborhood: 'richville',          type: 'temple', displayName: 'HALL OF SKARHOL',       godId: 'skarhol' },
  { id: 'richville_temple_sofiel',         neighborhood: 'richville',          type: 'temple', displayName: "SOFIEL'S SANCTUM",      godId: 'sofiel' },
  { id: 'center_city_temple_beroan',       neighborhood: 'center_city',        type: 'temple', displayName: "BEROAN'S FLAME",        godId: 'beroan' },
  { id: 'center_city_temple_azorius',      neighborhood: 'center_city',        type: 'temple', displayName: 'AZORIUS GATE',          godId: 'azorius' },
  { id: 'downtown_temple_marena',          neighborhood: 'downtown',           type: 'temple', displayName: "MARENA'S DEPTHS",       godId: 'marena' },
  { id: 'university_heights_temple_mesin', neighborhood: 'university_heights', type: 'temple', displayName: "MESIN'S LIGHT",         godId: 'mesin' },
  // Sprint 13: Furniture stores
  { id: 'the_skids_furniture',            neighborhood: 'the_skids',          type: 'furniture_store', displayName: 'JUNK FURNITURE' },
  { id: 'the_burbs_furniture',            neighborhood: 'the_burbs',          type: 'furniture_store', displayName: 'HOME DEPOT WIZARD' },
  { id: 'richville_furniture',            neighborhood: 'richville',          type: 'furniture_store', displayName: 'FINE FURNISHINGS' },
  { id: 'center_city_furniture',          neighborhood: 'center_city',        type: 'furniture_store', displayName: 'ARTISAN DECOR' },
  { id: 'downtown_furniture',             neighborhood: 'downtown',           type: 'furniture_store', displayName: 'OFFICE SURPLUS' },
  { id: 'university_heights_furniture',   neighborhood: 'university_heights', type: 'furniture_store', displayName: 'DORM LIQUIDATORS' },
  // Sprint 14: University
  { id: 'university_heights_university', neighborhood: 'university_heights', type: 'university',       displayName: 'UNIVERSITY' },
  // Sprint 16: University Bookstore and Spell Scroll Stores
  { id: 'university_heights_bookstore',    neighborhood: 'university_heights', type: 'university_bookstore', displayName: 'UNIVERSITY BOOKSTORE' },
  { id: 'the_skids_scroll_store',          neighborhood: 'the_skids',          type: 'spell_scroll_store',   displayName: 'SCROLLS & SUNDRIES' },
  { id: 'the_burbs_scroll_store',          neighborhood: 'the_burbs',          type: 'spell_scroll_store',   displayName: 'MYSTIC PAGES' },
  { id: 'richville_scroll_store',          neighborhood: 'richville',          type: 'spell_scroll_store',   displayName: 'ARCANE EMPORIUM' },
  { id: 'center_city_scroll_store',        neighborhood: 'center_city',        type: 'spell_scroll_store',   displayName: 'THE SCROLL SHOP' },
  { id: 'downtown_scroll_store',           neighborhood: 'downtown',           type: 'spell_scroll_store',   displayName: 'PARCHMENT & INK' },
  { id: 'university_heights_scroll_store', neighborhood: 'university_heights', type: 'spell_scroll_store',   displayName: 'CAMPUS SCROLLERY' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLocationData(id: LocationId): LocationData {
  const loc = LOCATIONS.find(l => l.id === id);
  if (!loc) throw new Error(`Unknown location: ${id}`);
  return loc;
}

export function getNeighborhoodData(id: NeighborhoodId): NeighborhoodData {
  const nb = NEIGHBORHOODS.find(n => n.id === id);
  if (!nb) throw new Error(`Unknown neighborhood: ${id}`);
  return nb;
}

export function getLocationNeighborhood(id: LocationId): NeighborhoodId {
  return getLocationData(id).neighborhood;
}

export function getLocationType(id: LocationId): LocationType {
  return getLocationData(id).type;
}

// Returns the single bodega for a given neighborhood.
export function getNeighborhoodBodega(neighborhoodId: NeighborhoodId): LocationId {
  const loc = LOCATIONS.find(
    l => l.neighborhood === neighborhoodId && l.type === 'bodega',
  );
  if (!loc) throw new Error(`No bodega in neighborhood: ${neighborhoodId}`);
  return loc.id;
}

// Returns all temples in a given neighborhood.
export function getNeighborhoodTemples(neighborhoodId: NeighborhoodId): LocationData[] {
  return LOCATIONS.filter(
    l => l.neighborhood === neighborhoodId && l.type === 'temple',
  );
}

// Returns the furniture store for a given neighborhood.
export function getNeighborhoodFurnitureStore(neighborhoodId: NeighborhoodId): LocationId {
  const loc = LOCATIONS.find(
    l => l.neighborhood === neighborhoodId && l.type === 'furniture_store',
  );
  if (!loc) throw new Error(`No furniture store in neighborhood: ${neighborhoodId}`);
  return loc.id;
}

// Returns the university in a neighborhood, or null if none.
export function getNeighborhoodUniversity(neighborhoodId: NeighborhoodId): LocationId | null {
  const loc = LOCATIONS.find(
    l => l.neighborhood === neighborhoodId && l.type === 'university',
  );
  return loc ? loc.id : null;
}

// Returns the scroll store for a given neighborhood.
export function getNeighborhoodScrollStore(neighborhoodId: NeighborhoodId): LocationId {
  const loc = LOCATIONS.find(
    l => l.neighborhood === neighborhoodId && l.type === 'spell_scroll_store',
  );
  if (!loc) throw new Error(`No scroll store in neighborhood: ${neighborhoodId}`);
  return loc.id;
}

// Returns the university bookstore in a neighborhood, or null if none.
export function getNeighborhoodBookstore(neighborhoodId: NeighborhoodId): LocationId | null {
  const loc = LOCATIONS.find(
    l => l.neighborhood === neighborhoodId && l.type === 'university_bookstore',
  );
  return loc ? loc.id : null;
}

// Returns the god a temple is dedicated to.
export function getTempleGod(id: LocationId): GodId {
  const loc = getLocationData(id);
  if (!loc.godId) throw new Error(`Location ${id} is not a temple`);
  return loc.godId;
}
