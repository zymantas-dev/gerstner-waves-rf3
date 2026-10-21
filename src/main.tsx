import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'
import App from './App'
import WebGLGuard from './components/WebGLGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebGLGuard>
      <App />
    </WebGLGuard>
  </StrictMode>,
)
