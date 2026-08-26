import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { LoadingBarProvider } from '@/context/LoadingBarContext'
import { ToastProvider } from '@/context/ToastContext'
import ToastContainer from '@/components/ui/ToastContainer'
import '@/i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LoadingBarProvider>
          <ToastProvider>
            <App />
            <ToastContainer />
          </ToastProvider>
        </LoadingBarProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
