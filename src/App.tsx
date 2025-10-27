import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-mono flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-500 mb-4">
          AELUN AWAKENED
        </h1>
        <p className="text-cyan-400 mb-8">
          [A Narrative Deckbuilding Roguelite]
        </p>
        <div className="space-y-4">
          <button className="btn btn-primary px-8 py-4 text-lg">
            ► NEW ADVENTURE
          </button>
          <div className="space-y-2">
            <button className="btn btn-secondary px-6 py-2">
              ► VIEW GRAVEYARD
            </button>
            <button className="btn btn-secondary px-6 py-2">
              ► COMPENDIUM
            </button>
            <button className="btn btn-secondary px-6 py-2">
              ► SETTINGS
            </button>
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Progress: 0% Complete</p>
          <p>Version: 1.0.0 | Offline Mode</p>
        </div>
      </div>
    </div>
  )
}

export default App
