import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Apply saved theme before React renders to avoid flash
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
