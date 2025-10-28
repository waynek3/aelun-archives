import './index.css'
import { lazy, Suspense } from 'react'
import { useUIStore } from '@/stores/uiStore'
import MainMenuScreen from '@/components/screens/MainMenuScreen'
import LifepathScreen from '@/components/screens/LifepathScreen'
import GameLoopScreen from '@/components/screens/GameLoopScreen'
import CharacterSummaryScreen from '@/components/screens/CharacterSummaryScreen'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
const CompendiumScreen = lazy(() => import('@/components/screens/CompendiumScreen'))
const GraveyardScreen = lazy(() => import('@/components/screens/GraveyardScreen'))
const PauseMenuScreen = lazy(() => import('@/components/screens/PauseMenuScreen'))
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
      <Suspense fallback={
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner message="Loading..." />
        </div>
      }>
        {Screen}
      </Suspense>
      <Modal open={modal.open} onClose={closeModal} title="Confirm">
        {modal.content}
      </Modal>
      <NotificationToast />
    </ErrorBoundary>
  )
}

export default App
