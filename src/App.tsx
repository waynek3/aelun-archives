import './index.css'
import { useUIStore } from '@/stores/uiStore'
import MainMenuScreen from '@/components/screens/MainMenuScreen'
import LifepathScreen from '@/components/screens/LifepathScreen'
import GameLoopScreen from '@/components/screens/GameLoopScreen'
import CharacterSummaryScreen from '@/components/screens/CharacterSummaryScreen'
import CompendiumScreen from '@/components/screens/CompendiumScreen'
import GraveyardScreen from '@/components/screens/GraveyardScreen'
import PauseMenuScreen from '@/components/screens/PauseMenuScreen'
import { Modal } from '@/components/ui/Modal'
import { useEffect, useRef } from 'react'

function App() {
  // DEBUG: Track render count
  const renderCount = useRef(0)
  renderCount.current++
  
  // FIX: Use separate selectors to avoid creating new objects on every render
  const screen = useUIStore((s) => s.screen)
  const modal = useUIStore((s) => s.modal)
  const closeModal = useUIStore((s) => s.closeModal)
  
  useEffect(() => {
    console.log('[DEBUG App] Render #', renderCount.current, 'Screen:', screen, 'Modal open:', modal.open)
    if (renderCount.current > 50) {
      console.error('[DEBUG App] INFINITE LOOP DETECTED - More than 50 renders!')
    }
  })

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
      default:
        return <MainMenuScreen />
    }
  })()

  return (
    <>
      {Screen}
      <Modal open={modal.open} onClose={closeModal} title="Confirm">
        {modal.content}
      </Modal>
    </>
  )
}

export default App
