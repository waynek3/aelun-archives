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

function App() {
  const { screen, modal, closeModal } = useUIStore((s) => ({
    screen: s.screen,
    modal: s.modal,
    closeModal: s.closeModal,
  }))

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
