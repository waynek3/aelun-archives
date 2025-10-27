import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedIfNeeded } from '@/lib/persistence/seeding'

async function bootstrap() {
  try {
    await seedIfNeeded()
  } catch {
    // Non-fatal: continue app startup
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
