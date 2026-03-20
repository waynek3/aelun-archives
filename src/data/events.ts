// Random event definitions (Sprint 23).
// Each event has a unique id, flavor text, location restrictions, and 3 choices.

import type { LocationType } from './locations';
import type { NeighborhoodId } from '../state/types';

export interface RandomEventDef {
  id: string;
  name: string;
  flavor: string;
  validLocationTypes: LocationType[] | 'any' | 'travel';
  validNeighborhoods?: NeighborhoodId[];
  triggerOn: 'action' | 'travel' | 'bong_break' | 'birthday';
  oneTime: boolean;
  minWizardFame?: number;
  baseProbability: number;
  choices: { label: string }[];
}

export const RANDOM_EVENTS: RandomEventDef[] = [
  {
    id: 'birthday',
    name: 'The Birthday',
    flavor: "It's your birthday. You don't feel any different.",
    validLocationTypes: 'any',
    triggerOn: 'birthday',
    oneTime: false,
    baseProbability: 1.0,
    choices: [
      { label: 'Celebrate alone' },
      { label: 'Buy yourself something nice' },
      { label: 'Contemplate mortality' },
    ],
  },
  {
    id: 'dad_dies',
    name: 'Dad Dies',
    flavor: 'You get a call. Your father has passed.',
    validLocationTypes: 'any',
    triggerOn: 'action',
    oneTime: true,
    baseProbability: 0.005,
    choices: [
      { label: 'Grieve properly' },
      { label: 'Check the will' },
      { label: 'He was already dead to me' },
    ],
  },
  {
    id: 'bong_breaks',
    name: 'The Bong Breaks',
    flavor: 'You hear a crack.',
    validLocationTypes: ['tower'],
    triggerOn: 'bong_break',
    oneTime: false,
    baseProbability: 1.0,  // probability handled by bong breakChance roll
    choices: [
      { label: 'Mourn it' },
      { label: 'Try to fix it' },
      { label: 'Throw it out' },
    ],
  },
  {
    id: 'suspicious_clerk',
    name: 'Suspicious Clerk',
    flavor: 'The clerk is watching you very carefully today.',
    validLocationTypes: ['bodega'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.08,
    choices: [
      { label: 'Act natural' },
      { label: 'Leave quietly' },
      { label: 'Smooth talk' },
    ],
  },
  {
    id: 'fellow_scratcher',
    name: 'Fellow Scratcher',
    flavor: 'Someone else at the counter has a handful of tickets.',
    validLocationTypes: ['bodega'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.08,
    choices: [
      { label: 'Chat them up' },
      { label: 'Ignore them' },
      { label: 'Share tips' },
    ],
  },
  {
    id: 'temple_judgment',
    name: 'Temple Judgment',
    flavor: 'A priest looks at you like they know something.',
    validLocationTypes: ['temple'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.10,
    choices: [
      { label: 'Confess your sins' },
      { label: 'Deny everything' },
      { label: 'Laugh it off' },
    ],
  },
  {
    id: 'campus_encounter',
    name: 'Campus Encounter',
    flavor: 'Someone recognizes you from your scholarship days.',
    validLocationTypes: ['university', 'university_bookstore'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.10,
    choices: [
      { label: 'Brag about wizard life' },
      { label: 'Hide' },
      { label: 'Catch up over coffee' },
    ],
  },
  {
    id: 'loan_shark',
    name: 'Loan Shark',
    flavor: 'A person in a very nice coat offers you money.',
    validLocationTypes: ['bodega', 'temple', 'furniture_store', 'spell_scroll_store'],
    validNeighborhoods: ['the_skids'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.06,
    choices: [
      { label: 'Take the money' },
      { label: 'Decline politely' },
      { label: 'Tell them off' },
    ],
  },
  {
    id: 'storm_warning',
    name: 'Storm Warning',
    flavor: 'The sky looks wrong.',
    validLocationTypes: 'travel',
    triggerOn: 'travel',
    oneTime: false,
    baseProbability: 0.10,
    choices: [
      { label: 'Push through' },
      { label: 'Find shelter' },
      { label: 'Turn back' },
    ],
  },
  {
    id: 'winning_ticket',
    name: 'The Winning Ticket',
    flavor: 'Someone just won big. You watched it happen.',
    validLocationTypes: ['bodega'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.06,
    choices: [
      { label: 'Cheer for them' },
      { label: 'Seethe with envy' },
      { label: 'Ask for a cut' },
    ],
  },
  {
    id: 'wizard_fame_moment',
    name: 'Wizard Fame Moment',
    flavor: 'Someone knows who you are.',
    validLocationTypes: ['bodega', 'temple', 'furniture_store', 'spell_scroll_store'],
    validNeighborhoods: ['center_city', 'downtown', 'richville'],
    triggerOn: 'action',
    oneTime: false,
    minWizardFame: 10,
    baseProbability: 0.08,
    choices: [
      { label: 'Embrace it' },
      { label: 'Deny it' },
      { label: 'Exploit it' },
    ],
  },
  {
    id: 'bad_batch',
    name: 'The Bad Batch',
    flavor: 'These tickets feel different.',
    validLocationTypes: ['bodega'],
    triggerOn: 'action',
    oneTime: false,
    baseProbability: 0.06,
    choices: [
      { label: 'Scratch anyway' },
      { label: 'Swap them out' },
      { label: 'Leave' },
    ],
  },
];

export function getEventDef(id: string): RandomEventDef {
  const def = RANDOM_EVENTS.find(e => e.id === id);
  if (!def) throw new Error(`Unknown event: ${id}`);
  return def;
}
