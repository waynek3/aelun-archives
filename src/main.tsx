import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedIfNeeded } from '@/lib/persistence/seeding'

// Ensure seeding completes before rendering to prevent hydration mismatches
async function initializeApp() {
  try {
    await seedIfNeeded()
  } catch (error) {
    console.error('Failed to seed data:', error)
  }
  
  const root = createRoot(document.getElementById('root')!)
  root.render(<App />)
}

// Initialize app after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}
