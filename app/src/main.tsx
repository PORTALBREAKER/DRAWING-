import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted font weights (bundled from npm, not fetched from Google Fonts'
// CDN) - keeps the app's "no network calls after first load" promise honest,
// right down to the typography.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
