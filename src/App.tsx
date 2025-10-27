import './index.css'
import { useUIStore } from '@/stores/uiStore'
import MainMenuScreen from '@/components/screens/MainMenuScreen'
import LifepathScreen from '@/components/screens/LifepathScreen'
import GameLoopScreen from '@/components/screens/GameLoopScreen'
import CharacterSummaryScreen from '@/components/screens/CharacterSummaryScreen'
import CompendiumScreen from '@/components/screens/CompendiumScreen'
import GraveyardScreen from '@/components/screens/GraveyardScreen'
import PauseMenuScreen from '@/components/screens/PauseMenuScreen'
// DeathScreen is handled within GameLoopScreen
import { Modal } from '@/components/ui/Modal'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { NotificationToast } from '@/components/ui/NotificationToast'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function App() {
  const screen = useUIStore((s) => s.screen)
  const modal = useUIStore((s) => s.modal)
  const closeModal = useUIStore((s) => s.closeModal)
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  const Screen = (() => {
    switch (screen) {
      case 'MainMenu':
        return <MainMenuScreen />
      case 'Lifepath':
        return <LifepathScreen />
      case 'CharacterSummary':
        return <CharacterSummaryScreen />
      case 'GameLoop':
        return <GameLoopScreen />
      case 'Compendium':
        return <CompendiumScreen />
      case 'Graveyard':
        return <GraveyardScreen />
      case 'PauseMenu':
        return <PauseMenuScreen />
      case 'Outcome':
        // Outcome screen is handled within GameLoopScreen
        return <MainMenuScreen />
      default:
        return <MainMenuScreen />
    }
  })()

  return (
    <ErrorBoundary>
      {Screen}
      <Modal open={modal.open} onClose={closeModal} title="Confirm">
        {modal.content}
      </Modal>
      <NotificationToast />
    </ErrorBoundary>
  )
}

export default App
