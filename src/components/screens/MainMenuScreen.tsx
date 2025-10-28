import { useUIStore } from '@/stores/uiStore'
import { useEffect, useState } from 'react'
import { getDiscoveryStats } from '@/lib/engine/discoveryManager'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'

export default function MainMenuScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    getDiscoveryStats().then(s => setProgress(s.completionPercentage)).catch(() => setProgress(0))
  }, [])

  return (
    <ScreenContainer>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-green-500 mb-2">AELUN AWAKENED</h1>
        <p className="text-cyan-400 mb-8">[A Narrative Deckbuilding Roguelite]</p>

        <div className="space-y-4">
          <Button className="px-8 py-4 text-lg" onClick={() => setScreen('Lifepath')}>
            ► NEW ADVENTURE
          </Button>

          <div className="space-y-2">
            <Button variant="secondary" className="px-6 py-2" onClick={() => setScreen('Graveyard')}>
              ► VIEW GRAVEYARD
            </Button>
            <Button variant="secondary" className="px-6 py-2" onClick={() => setScreen('Compendium')}>
              ► COMPENDIUM
            </Button>
            <Button variant="secondary" className="px-6 py-2" onClick={() => setScreen('PauseMenu')}>
              ► SETTINGS
            </Button>
          </div>
        </div>

        <div className="mt-8 text-sm opacity-70">
          <p>Progress: {progress}% Complete</p>
          <p>Version: 1.0.0 | Offline Mode</p>
        </div>
      </div>
    </ScreenContainer>
  )
}
