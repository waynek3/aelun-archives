import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedIfNeeded } from '@/lib/persistence/seeding'

// Ensure seeding completes before rendering to prevent hydration mismatches
async function initializeApp() {
  console.log('[DEBUG main] Starting app initialization...')
  try {
    console.log('[DEBUG main] Seeding data...')
    await seedIfNeeded()
    console.log('[DEBUG main] Seeding complete!')
  } catch (error) {
    console.error('[DEBUG main] Failed to seed data:', error)
  }
  
  console.log('[DEBUG main] Rendering React app...')
  const root = createRoot(document.getElementById('root')!)
  root.render(<App />)
  console.log('[DEBUG main] React app rendered!')
}

// Initialize app after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}
