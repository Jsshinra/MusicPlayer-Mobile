import './shared/native/ipc-stubs'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import AppLayout from './app/layout/AppLayout'
import { ensureLocalProviderRegistered } from './providers/local/register-local-provider'
import './index.css'

ensureLocalProviderRegistered()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLayout />
  </StrictMode>
)
