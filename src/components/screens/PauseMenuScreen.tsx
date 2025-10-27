import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'

export default function PauseMenuScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <ScreenContainer>
      <div className="py-12 text-center">
        <h2 className="text-xl text-yellow-400 font-bold uppercase mb-2">┌─ PAUSED ─┐</h2>
        <p className="text-sm opacity-80 mb-6">(Game paused - click RESUME to continue)</p>

        <div className="space-y-2">
          <Button onClick={() => setScreen('GameLoop')}>► RESUME ADVENTURE</Button>
          <Button variant="secondary">► CHARACTER SHEET</Button>
          <Button variant="secondary" onClick={() => setScreen('Compendium')}>► COMPENDIUM</Button>
          <Button variant="secondary">► SETTINGS</Button>
          <Button variant="warning" onClick={() => setScreen('MainMenu')}>► SAVE & QUIT TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
