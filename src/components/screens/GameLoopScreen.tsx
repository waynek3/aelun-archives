import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'

export default function GameLoopScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <ScreenContainer>
      <div className="py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-green-500 font-bold uppercase">Current Scene</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setScreen('PauseMenu')}>≡ MENU</Button>
          </div>
        </header>

        <section className="panel p-4">
          <h3 className="text-cyan-400 uppercase">The Homestead</h3>
          <p className="opacity-90 max-w-[66ch]">A place of routine and rest.</p>
          <div className="mt-2 text-xs">
            <span className="tag">[HOMESTEAD]</span> <span className="tag">[SAFE]</span> <span className="tag">[DAY]</span>
          </div>
        </section>

        <section className="panel-double p-4">
          <h3 className="text-green-500 uppercase font-bold">What do you do?</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button>► TAKE IT IN (Untargeted)</Button>
            <Button>► WORK (Untargeted)</Button>
            <Button>► PRAY (Targeted)</Button>
            <Button>► TRAVEL... (Targeted)</Button>
          </div>
        </section>

        <footer className="panel p-3 text-xs flex items-center justify-between">
          <div>HP: ███████░░░ [70/100]</div>
          <div>Traits: 3</div>
          <div>Turn: 1 (Day)</div>
        </footer>

        <div className="mt-4">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
