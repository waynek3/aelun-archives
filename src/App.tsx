import './index.css'
import { useGameStore } from '@/stores/gameStore'
import StoreScreen from '@/components/screens/StoreScreen'
import ScratchScreen from '@/components/screens/ScratchScreen'
import EndOfDayScreen from '@/components/screens/EndOfDayScreen'

function App() {
  const screen = useGameStore(s => s.screen)

  switch (screen) {
    case 'store':
      return <StoreScreen />
    case 'scratch':
      return <ScratchScreen />
    case 'endofday':
      return <EndOfDayScreen />
    default:
      return <StoreScreen />
  }
}

export default App
