import { useEffect, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { createGraveyardEntry, addToGraveyard } from '@/lib/engine/graveyardManager'
import type { GraveyardEntry } from '@/types/meta'

import type { Character } from '@/types/character'

interface DeathScreenProps {
  character: Character
  causeOfDeath: string
  onContinue: () => void
}

export default function DeathScreen({ character, causeOfDeath }: DeathScreenProps) {
  const setScreen = useUIStore((s) => s.setScreen)
  const setCharacter = useGameStore((s) => s.setCharacter)
  const [graveyardEntry, setGraveyardEntry] = useState<GraveyardEntry | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (character) {
      const entry = createGraveyardEntry(character, causeOfDeath)
      setGraveyardEntry(entry)
      
      // Save to graveyard
      setSaving(true)
      addToGraveyard(entry)
        .then(() => {
          setSaving(false)
        })
        .catch((error) => {
          console.error('Failed to save to graveyard:', error)
          setSaving(false)
        })
    }
  }, [character, causeOfDeath])

  const handleNewCharacter = () => {
    setCharacter(null)
    setScreen('MainMenu')
  }

  const handleViewGraveyard = () => {
    setScreen('Graveyard')
  }

  if (!graveyardEntry) {
    return (
      <ScreenContainer>
        <div className="py-12 text-center">
          <LoadingSpinner message="Recording your fate..." size="lg" />
        </div>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <div className="py-12 text-center">
        <h2 className="text-2xl text-red-400 font-bold uppercase mb-4">
          ⚰ YOU HAVE DIED ⚰
        </h2>
        
        <div className="panel p-6 text-sm text-cyan-400 mb-6">
          <p className="text-lg mb-4 text-red-300">
            {character.name} has met their end.
          </p>
          
          <div className="space-y-2 text-left">
            <p><strong>Cause of Death:</strong> {causeOfDeath}</p>
            <p><strong>Survived:</strong> {graveyardEntry.survived} turns</p>
            <p><strong>Died At:</strong> {graveyardEntry.diedAt}</p>
            <p><strong>Lifepath:</strong> {graveyardEntry.lifepath.join(' → ')}</p>
            
            {graveyardEntry.achievements.length > 0 && (
              <div className="mt-4">
                <p className="text-yellow-400 font-bold mb-2">Achievements:</p>
                <ul className="list-disc list-inside space-y-1">
                  {graveyardEntry.achievements.map((achievement, index) => (
                    <li key={index} className="text-yellow-300">{achievement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {Object.keys(graveyardEntry.peakAffinities).length > 0 && (
              <div className="mt-4">
                <p className="text-green-400 font-bold mb-2">Peak Affinities:</p>
                <div className="space-y-1">
                  {Object.entries(graveyardEntry.peakAffinities).map(([entity, value]) => (
                    <p key={entity} className="text-green-300">
                      {entity}: {value > 0 ? '+' : ''}{value}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleNewCharacter}
            disabled={saving}
          >
            {saving ? '► SAVING...' : '► START NEW CHARACTER'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleViewGraveyard}
            disabled={saving}
          >
            ► VIEW GRAVEYARD
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setScreen('MainMenu')}
            disabled={saving}
          >
            ► RETURN TO MENU
          </Button>
        </div>
      </div>
    </ScreenContainer>
  )
}

// Import LoadingSpinner component
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'