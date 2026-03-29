// Shared modal state manager.
// Each screen tracks its own open modal by screen ID.
// renderer.ts calls resetAllModals() on screen transitions so modals don't
// persist when the player navigates away and returns later.

const _state: Record<string, string | null> = {};

export function getModal(screenId: string): string | null {
  return _state[screenId] ?? null;
}

export function openModal(screenId: string, modalId: string, rerender: () => void): void {
  _state[screenId] = modalId;
  rerender();
}

export function closeModal(screenId: string, rerender: () => void): void {
  _state[screenId] = null;
  rerender();
}

export function resetAllModals(): void {
  for (const key of Object.keys(_state)) {
    _state[key] = null;
  }
}
