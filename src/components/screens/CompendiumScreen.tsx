import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'

export default function CompendiumScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  return (
    <ScreenContainer>
      <div className="py-8">
        <h2 className="text-2xl text-green-500 font-bold uppercase mb-2">COMPENDIUM OF DISCOVERY</h2>
        <p className="text-sm text-cyan-400 mb-6">[Placeholder implementation for Sprint 4]</p>

        <div className="panel p-4">
          <p>Compendium UI to be implemented in Phase 4 (Sprint 12).</p>
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ RETURN TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
