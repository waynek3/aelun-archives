import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'

export default function GameLoopScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const character = useGameStore((s) => s.character)
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
          <h3 className="text-cyan-400 uppercase">{character?.worldState.location ?? 'The Homestead'}</h3>
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
          <div>HP: ███████░░░ [{character?.currentHP ?? 10}/{character?.maxHP ?? 10}]</div>
          <div>Traits: {character?.traits.length ?? 0}</div>
          <div>Turn: {character?.turnCount ?? 0} (Day)</div>
        </footer>

        <div className="mt-4">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ BACK TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
