import { useEffect, useState } from 'react'
import { ScreenContainer } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useUIStore } from '@/stores/uiStore'
import { getCompendium, getDiscoveryStats } from '@/lib/engine/discoveryManager'
import { getActionsArray, getPredicateCards } from '@/lib/utils/content'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { Compendium } from '@/types/meta'

export default function CompendiumScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const [compendium, setCompendium] = useState<Compendium | null>(null)
  const [stats, setStats] = useState<{
    totalDiscovered: number;
    cardsDiscovered: number;
    predicatesDiscovered: number;
    traitsDiscovered: number;
    affinitiesDiscovered: number;
    loreDiscovered: number;
    completionPercentage: number;
  } | null>(null)
  const [actions, setActions] = useState<ActionCard[]>([])
  const [predicates, setPredicates] = useState<Record<string, PredicateCard>>({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'cards' | 'predicates' | 'traits' | 'affinities' | 'lore'>('cards')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCompendium()
  }, [])

  const loadCompendium = async () => {
    setLoading(true)
    try {
      const [compendiumData, statsData, actionsData, predicatesData] = await Promise.all([
        getCompendium(),
        getDiscoveryStats(),
        getActionsArray(),
        getPredicateCards()
      ])
      setCompendium(compendiumData)
      setStats(statsData)
      setActions(actionsData)
      setPredicates(predicatesData)
    } catch (error) {
      console.error('Failed to load compendium:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDiscoveredContent = () => {
    if (!compendium) return []

    switch (activeCategory) {
      case 'cards':
        return actions.filter(action => compendium.discoveredCards.includes(action.id))
      case 'predicates':
        return Object.values(predicates).filter(predicate => compendium.discoveredPredicates.includes(predicate.id))
      case 'traits':
        return [] // Traits would need to be loaded separately
      case 'affinities':
        return compendium.discoveredAffinities
      case 'lore':
        return compendium.loreFragments
      default:
        return []
    }
  }

  const filteredContent = getDiscoveredContent().filter(item => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    
    if (typeof item === 'string') {
      return item.toLowerCase().includes(searchLower)
    }
    
    if ('name' in item) {
      return item.name.toLowerCase().includes(searchLower) ||
             (item.description && item.description.toLowerCase().includes(searchLower))
    }
    
    return false
  })

  if (loading) {
    return (
      <ScreenContainer>
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner message="Loading compendium..." size="lg" />
        </div>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      <div className="py-8">
        <h2 className="text-2xl text-green-500 font-bold uppercase mb-2">COMPENDIUM OF DISCOVERY</h2>
        <p className="text-sm text-cyan-400 mb-6">(Your Encyclopedia of Discovered Knowledge)</p>

        {stats && (
          <div className="panel p-4 mb-6">
            <h3 className="text-lg text-yellow-400 font-bold mb-3">Discovery Progress</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p><strong>Total Discovered:</strong> {stats.totalDiscovered}</p>
                <p><strong>Cards:</strong> {stats.cardsDiscovered}</p>
                <p><strong>Locations:</strong> {stats.predicatesDiscovered}</p>
              </div>
              <div>
                <p><strong>Traits:</strong> {stats.traitsDiscovered}</p>
                <p><strong>Affinities:</strong> {stats.affinitiesDiscovered}</p>
                <p><strong>Lore:</strong> {stats.loreDiscovered}</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-center mt-1">{stats.completionPercentage}% Complete</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button 
              variant={activeCategory === 'cards' ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory('cards')}
            >
              Action Cards
            </Button>
            <Button 
              variant={activeCategory === 'predicates' ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory('predicates')}
            >
              Locations
            </Button>
            <Button 
              variant={activeCategory === 'traits' ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory('traits')}
            >
              Traits
            </Button>
            <Button 
              variant={activeCategory === 'affinities' ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory('affinities')}
            >
              Affinities
            </Button>
            <Button 
              variant={activeCategory === 'lore' ? 'primary' : 'secondary'}
              onClick={() => setActiveCategory('lore')}
            >
              Lore
            </Button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search discovered content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-cyan-400 text-cyan-400 rounded focus:outline-none focus:border-green-400"
            />
          </div>

          {filteredContent.length === 0 ? (
            <div className="panel p-4">
              <p className="text-cyan-400">
                {searchTerm 
                  ? `No discovered ${activeCategory} match "${searchTerm}"`
                  : `No ${activeCategory} discovered yet. Play the game to discover content!`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContent.map((item, index) => (
                <div key={index} className="panel p-4">
                  {typeof item === 'string' ? (
                    <div>
                      <h4 className="text-lg text-yellow-400 font-bold">{item}</h4>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-lg text-yellow-400 font-bold">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-cyan-400 mt-2">{item.description}</p>
                      )}
                      {activeCategory === 'cards' && 'tags' in item && (
                        <div className="mt-2">
                          <p className="text-xs text-green-400">
                            Tags: {item.tags.join(', ')}
                          </p>
                        </div>
                      )}
                      {activeCategory === 'predicates' && 'sceneTags' in item && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-400">
                            Scene: {item.sceneTags.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button variant="secondary" onClick={() => setScreen('MainMenu')}>◄ RETURN TO MENU</Button>
        </div>
      </div>
    </ScreenContainer>
  )
}
