import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/global.css";
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary variant="page" fallbackMessage="The app encountered an unexpected error. Please refresh the page.">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
