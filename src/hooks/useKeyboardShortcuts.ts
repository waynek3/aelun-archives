import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export function useKeyboardShortcuts() {
  const setScreen = useUIStore((s) => s.setScreen)
  const screen = useUIStore((s) => s.screen)
  const autoSave = useGameStore((s) => s.autoSave)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case 'Escape':
          if (screen === 'GameLoop') {
            setScreen('PauseMenu')
          } else if (screen === 'PauseMenu') {
            setScreen('GameLoop')
          }
          break

        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            autoSave()
          }
          break

        case 'm':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setScreen('MainMenu')
          }
          break

        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setScreen('Compendium')
          }
          break

        case 'g':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setScreen('Graveyard')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setScreen, screen, autoSave])
}