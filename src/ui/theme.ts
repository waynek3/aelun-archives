import type { ColorScheme } from '../state/types';
import { loadTheme } from '../state/save';

// Apply the color scheme to <html data-theme="...">
export function applyTheme(scheme: ColorScheme): void {
  document.documentElement.setAttribute('data-theme', scheme);
}

// Load persisted theme and apply it. Returns the scheme in use.
export function initTheme(stateScheme: ColorScheme): ColorScheme {
  const saved = loadTheme();
  const scheme: ColorScheme =
    saved === 'blue' || saved === 'green' || saved === 'orange'
      ? saved
      : stateScheme === 'blue' || stateScheme === 'green' || stateScheme === 'orange'
        ? stateScheme
        : 'blue';
  applyTheme(scheme);
  return scheme;
}
