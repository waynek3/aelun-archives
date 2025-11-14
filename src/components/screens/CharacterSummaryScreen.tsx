import { ScreenContainer } from '@/components/ui/Layout'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useGameStore } from '@/stores/gameStore'
import { lifepathService } from '@/lib/engine/lifepath'
import { saveCharacter } from '@/lib/persistence/saveManager'
import { useState, useMemo, useEffect, useRef } from 'react'
import { getUnlockedCardIds } from '@/lib/engine/cardEvolution'

export default function CharacterSummaryScreen() {
  // DEBUG: Track render count
  const renderCount = useRef(0)
  renderCount.current++
  
  // FIX: Use separate selectors to avoid creating new objects
  const pendingLifepath = useUIStore((s) => s.pendingLifepath)
  const setScreen = useUIStore((s) => s.setScreen)
  const setPendingLifepath = useUIStore((s) => s.setPendingLifepath)
  const openModal = useUIStore((s) => s.openModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const setCharacter = useGameStore((s) => s.setCharacter)
  
  useEffect(() => {
    console.log('[DEBUG CharacterSummaryScreen] Render #', renderCount.current, 'Has pendingLifepath:', !!pendingLifepath)
    if (renderCount.current > 50) {
      console.error('[DEBUG CharacterSummaryScreen] INFINITE LOOP DETECTED!')
    }
  })

  const [name, setName] = useState('')
  const [unlockedCards, setUnlockedCards] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true
    getUnlockedCardIds()
      .then((ids) => {
        if (isMounted) setUnlockedCards(ids)
      })
      .catch((error) => {
        console.error('Failed to load unlocked cards:', error)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const isComplete = useMemo(() => !!pendingLifepath && lifepathService.isComplete(pendingLifepath), [pendingLifepath])
  const previewCharacter = useMemo(() => {
      if (!pendingLifepath) return null
      const baseCharacter = lifepathService.buildCharacter(pendingLifepath, name || 'Unnamed Adventurer')
      if (unlockedCards.length === 0) {
        return baseCharacter
      }
      const deck = Array.from(new Set([...baseCharacter.actionDeck, ...unlockedCards]))
      return { ...baseCharacter, actionDeck: deck }
    }, [pendingLifepath, name, unlockedCards])

  if (!pendingLifepath || !isComplete || !previewCharacter) {
    // Safety: if reached without completed lifepath, return to lifepath
    return (
      <ScreenContainer>
        <div className="py-6 space-y-4">
          <div className="panel p-4 text-sm text-cyan-400 mb-4">
            Invalid character state. Returning to character creation...
          </div>
          <Button onClick={() => setScreen('Lifepath')}>◄ BACK TO LIFEPATH</Button>
        </div>
      </ScreenContainer>
    )
  }

  async function handleConfirm() {
    const finalName = (name || '').trim() || 'Unnamed Adventurer'
    const character = lifepathService.buildCharacter(pendingLifepath!, finalName)
    const unlocked = unlockedCards.length > 0 ? unlockedCards : await getUnlockedCardIds()
    if (unlocked.length > 0) {
      character.actionDeck = Array.from(new Set([...character.actionDeck, ...unlocked]))
    }
    await saveCharacter(character)
    setCharacter(character)
    setPendingLifepath(null)
    setScreen('GameLoop')
  }

  function handleCancel() {
    openModal(
      <div>
        <p>Are you sure you want to abandon character creation? Progress will be lost.</p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={closeModal}>CANCEL</Button>
          <Button
            onClick={() => {
              setPendingLifepath(null)
              closeModal()
              setScreen('MainMenu')
            }}
          >
            ► ABANDON
          </Button>
        </div>
      </div>
    )
  }

    return (
      <ScreenContainer>
        <div className="py-8 space-y-4">
          <h2 className="text-2xl text-green-500 font-bold uppercase">Character Summary</h2>
          <div className="text-xs text-cyan-400">Review your character and confirm</div>

          <Panel className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-400 uppercase text-xs mb-1" htmlFor="name">Name</label>
                <input
                  id="name"
                  aria-label="Character name"
                  className="w-full bg-transparent border border-cyan-400/40 focus:border-yellow-300 outline-none px-3 py-2 rounded-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name"
                />

                <div className="mt-4">
                  <div className="uppercase text-cyan-400 mb-1">Stats</div>
                  <div>Strength: {previewCharacter.stats.strength}</div>
                  <div>Agility: {previewCharacter.stats.agility}</div>
                  <div>Insight: {previewCharacter.stats.insight}</div>
                  <div>Charisma: {previewCharacter.stats.charisma}</div>
                  <div>Fortitude: {previewCharacter.stats.fortitude}</div>
                  <div>Will: {previewCharacter.stats.will}</div>
                </div>
              </div>

              <div>
                <div className="uppercase text-cyan-400 mb-1">Traits</div>
                <ul className="list-disc list-inside text-sm">
                  {previewCharacter.traits.map((t) => (
                    <li key={t.id}>{t.name}</li>
                  ))}
                </ul>

                <div className="mt-4 uppercase text-cyan-400 mb-1">Starting Deck</div>
                <div className="text-sm">{previewCharacter.actionDeck.length} cards</div>
                {unlockedCards.length > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    Includes {unlockedCards.length} unlocked card{unlockedCards.length === 1 ? '' : 's'}
                  </div>
                )}

                <div className="mt-4 uppercase text-cyan-400 mb-1">Starting Location</div>
                <div className="text-sm">{previewCharacter.worldState.location}</div>
              </div>
            </div>
          </Panel>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel}>◄ CANCEL</Button>
            <Button onClick={handleConfirm} disabled={(name || '').trim().length === 0}>► BEGIN ADVENTURE</Button>
          </div>
        </div>
      </ScreenContainer>
    )
}
