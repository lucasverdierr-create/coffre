import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, getStoredTheme } from './lib/misc'
import './styles.css'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Application installable et utilisable hors ligne (PWA)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
