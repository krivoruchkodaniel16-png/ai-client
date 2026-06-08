import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children, token, onChangeToken }) {
  const loc = useLocation()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={header}>
        <Link to="/" style={{ color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>AI Services</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {token ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>●</span> Токен активен
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>●</span> Нет токена
            </span>
          )}
          <button className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }} onClick={onChangeToken}>
            {token ? '🔄 Сменить токен' : '🔑 Ввести токен'}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '2rem 1rem' }}>
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: '1rem', color: 'var(--text2)', fontSize: '0.8rem', borderTop: '1px solid var(--border)' }}>
        AI Services Client
      </footer>
    </div>
  )
}

const header = {
  background: 'var(--bg2)',
  borderBottom: '1.5px solid var(--border)',
  padding: '0.85rem 2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 100,
}
