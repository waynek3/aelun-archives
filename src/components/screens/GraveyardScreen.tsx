import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'

export default function GraveyardScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <ScreenContainer>
      <div className="py-8">
        <h2 className="text-2xl text-green-500 font-bold uppercase mb-2">THE GRAVEYARD</h2>
        <p className="text-sm text-cyan-400 mb-6">(A Memorial to Past Characters)</p>

        <div className="panel p-4 space-y-2">
          <div className="panel p-3">No entries yet.</div>
          <div className="panel p-3">Create characters and die gloriously to fill this list.</div>
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ RETURN TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
