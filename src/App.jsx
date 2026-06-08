import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useToken } from './hooks/useToken'
import Layout from './components/Layout'
import TokenModal from './components/TokenModal'
import Home from './pages/Home'
import ChatterBlast from './pages/ChatterBlast'
import DreamWeaver from './pages/DreamWeaver'
import MindReader from './pages/MindReader'

export default function App() {
  const [token, setToken] = useToken()
  const [showTokenModal, setShowTokenModal] = useState(false)

  const handleTokenSave = (t) => {
    setToken(t)
    setShowTokenModal(false)
  }

  return (
    <BrowserRouter>
      {showTokenModal && (
        <TokenModal initial={token} onSave={handleTokenSave} />
      )}
      <Layout token={token} onChangeToken={() => setShowTokenModal(true)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/chatterblast"
            element={<ChatterBlast token={token} onTokenChange={(t) => { setToken(t) }} />}
          />
          <Route
            path="/dreamweaver"
            element={<DreamWeaver token={token} onTokenChange={(t) => { setToken(t) }} />}
          />
          <Route
            path="/mindreader"
            element={<MindReader token={token} onTokenChange={(t) => { setToken(t) }} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
