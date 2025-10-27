import './index.css'
import { useUIStore } from '@/stores/uiStore'
import MainMenuScreen from '@/components/screens/MainMenuScreen'
import LifepathScreen from '@/components/screens/LifepathScreen'
import GameLoopScreen from '@/components/screens/GameLoopScreen'
import CompendiumScreen from '@/components/screens/CompendiumScreen'
import GraveyardScreen from '@/components/screens/GraveyardScreen'
import PauseMenuScreen from '@/components/screens/PauseMenuScreen'

function App() {
  const screen = useUIStore((s) => s.screen)

  switch (screen) {
    case 'MainMenu':
      return <MainMenuScreen />
    case 'Lifepath':
      return <LifepathScreen />
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
}

export default App
