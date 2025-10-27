import { useEffect, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useUIStore } from '@/stores/uiStore'
import { getGraveyardEntries, getGraveyardStats } from '@/lib/engine/graveyardManager'
import type { GraveyardEntry } from '@/types/meta'

export default function GraveyardScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const [entries, setEntries] = useState<GraveyardEntry[]>([])
  const [stats, setStats] = useState<{
    totalCharacters: number;
    totalTurns: number;
    averageSurvival: number;
    longestSurvival: number;
    mostCommonCause: string;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'survival' | 'name'>('date')

  useEffect(() => {
    loadGraveyard()
  }, [])

  const loadGraveyard = async () => {
    setLoading(true)
    try {
      const [graveyardEntries, graveyardStats] = await Promise.all([
        getGraveyardEntries(),
        getGraveyardStats()
      ])
      setEntries(graveyardEntries)
      setStats(graveyardStats)
    } catch (error) {
      console.error('Failed to load graveyard:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.timestamp - a.timestamp
      case 'survival':
        return b.survived - a.survived
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <ScreenContainer>
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner message="Loading graveyard..." size="lg" />
        </div>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <div className="py-8">
        <h2 className="text-2xl text-green-500 font-bold uppercase mb-2">THE GRAVEYARD</h2>
        <p className="text-sm text-cyan-400 mb-6">(A Memorial to Past Characters)</p>

        {stats && (
          <div className="panel p-4 mb-6">
            <h3 className="text-lg text-yellow-400 font-bold mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Total Characters:</strong> {stats.totalCharacters}</p>
                <p><strong>Total Turns:</strong> {stats.totalTurns}</p>
              </div>
              <div>
                <p><strong>Average Survival:</strong> {stats.averageSurvival} turns</p>
                <p><strong>Longest Survival:</strong> {stats.longestSurvival} turns</p>
              </div>
            </div>
            <p className="mt-2 text-sm">
              <strong>Most Common Cause:</strong> {stats.mostCommonCause}
            </p>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="panel p-4 space-y-2">
            <div className="panel p-3">No entries yet.</div>
            <div className="panel p-3">Create characters and die gloriously to fill this list.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={sortBy === 'date' ? 'primary' : 'secondary'}
                onClick={() => setSortBy('date')}
              >
                Sort by Date
              </Button>
              <Button 
                variant={sortBy === 'survival' ? 'primary' : 'secondary'}
                onClick={() => setSortBy('survival')}
              >
                Sort by Survival
              </Button>
              <Button 
                variant={sortBy === 'name' ? 'primary' : 'secondary'}
                onClick={() => setSortBy('name')}
              >
                Sort by Name
              </Button>
            </div>

            {sortedEntries.map((entry) => (
              <div key={entry.characterId} className="panel p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg text-yellow-400 font-bold">{entry.name}</h3>
                  <span className="text-sm text-cyan-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p><strong>Survived:</strong> {entry.survived} turns</p>
                    <p><strong>Died At:</strong> {entry.diedAt}</p>
                    <p><strong>Cause:</strong> {entry.causeOfDeath}</p>
                  </div>
                  <div>
                    <p><strong>Lifepath:</strong> {entry.lifepath.join(' → ')}</p>
                    <p><strong>Achievements:</strong> {entry.achievements.length}</p>
                  </div>
                </div>

                {entry.achievements.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-green-400 font-bold mb-1">Achievements:</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.achievements.map((achievement, index) => (
                        <span 
                          key={index} 
                          className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded"
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(entry.peakAffinities).length > 0 && (
                  <div>
                    <p className="text-sm text-blue-400 font-bold mb-1">Peak Affinities:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(entry.peakAffinities).map(([entity, value]) => (
                        <span 
                          key={entity}
                          className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded"
                        >
                          {entity}: {value > 0 ? '+' : ''}{value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ RETURN TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
