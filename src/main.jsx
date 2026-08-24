import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import { registerSW } from 'virtual:pwa-register'

import './index.css'
import './firebase'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
