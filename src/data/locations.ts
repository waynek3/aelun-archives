// Neighborhood and location data.
// Central source of truth for all location IDs, display names, neighborhood mapping,
// and flavor text. No game logic here — pure static data.

import type { NeighborhoodId, LocationId } from '../state/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocationType = 'tower' | 'bodega';

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
