import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'

export default function LifepathScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <ScreenContainer>
      <div className="py-8">
        <h2 className="text-2xl text-green-500 font-bold uppercase mb-2">LIFEPATH: YOUR ORIGINS</h2>
        <p className="text-sm text-cyan-400 mb-6">[Placeholder implementation for Sprint 4]</p>
        <div className="panel p-4">
          <p>Coming next sprints: 10-step narrative character creation with choices and preview.</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK</Button>
          <Button onClick={() => setScreen('GameLoop')}>► SKIP TO GAME LOOP</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
