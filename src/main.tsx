import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedIfNeeded } from '@/lib/persistence/seeding'

// Render immediately, seed data in the background to avoid blocking UI
const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Kick off seeding asynchronously; errors are non-fatal
seedIfNeeded().catch(() => {})
