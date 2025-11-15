import { useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getCharacterAffinities } from '@/lib/engine/affinityManager'

export default function PauseMenuScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const character = useGameStore((s) => s.character)
  const autoSave = useGameStore((s) => s.autoSave)
  const showAffinityHints = useSettingsStore((s) => s.showAffinityHints)
  const toggleAffinityHints = useSettingsStore((s) => s.toggleAffinityHints)
  const [saving, setSaving] = useState(false)

  const handleSaveAndQuit = async () => {
    setSaving(true)
    try {
      await autoSave()
      setScreen('MainMenu')
    } catch (error) {
      console.error('Save failed:', error)
      // Still go to main menu even if save fails
      setScreen('MainMenu')
    } finally {
      setSaving(false)
    }
  }

  const handleViewStats = () => {
    if (!character) return
    
    const affinities = getCharacterAffinities(character)
    const affinityText = affinities.length > 0 
      ? `\nAffinities:\n${affinities.map(a => `  ${a.entity}: ${a.score} (${a.level})`).join('\n')}`
      : '\nAffinities: None discovered'
    
    const stats = `Character: ${character.name}
Lifepath: ${character.lifepath?.map(l => l.name).join(' → ') || 'Unknown'}
Turns Survived: ${character.turnCount || 0}
HP: ${character.currentHP || 0}/${character.maxHP || 0}
Stats: STR:${character.stats?.strength || 0} AGI:${character.stats?.agility || 0} INS:${character.stats?.insight || 0}
Traits: ${character.traits?.length || 0}
Location: ${character.worldState?.location || 'Unknown'}${affinityText}`

    alert(stats)
  }

  return (
    <ScreenContainer>
      <div className="py-12 text-center">
        <h2 className="text-xl text-yellow-400 font-bold uppercase mb-2">┌─ PAUSED ─┐</h2>
        <p className="text-sm opacity-80 mb-6">(Game paused - click RESUME to continue)</p>

        <div className="space-y-2">
          <Button onClick={() => setScreen('GameLoop')}>► RESUME ADVENTURE</Button>
          <Button variant="secondary" onClick={handleViewStats}>► CHARACTER SHEET</Button>
          <Button variant="secondary" onClick={toggleAffinityHints}>
            ► {showAffinityHints ? 'HIDE' : 'SHOW'} AFFINITY HINTS
          </Button>
          <Button variant="secondary" onClick={() => setScreen('Compendium')}>► COMPENDIUM</Button>
          <Button variant="secondary">► SETTINGS</Button>
          <Button 
            variant="warning" 
            onClick={handleSaveAndQuit}
            disabled={saving}
          >
            {saving ? '► SAVING...' : '► SAVE & QUIT TO MENU'}
          </Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
