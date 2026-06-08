import React, { useState } from 'react'

export default function TokenModal({ onSave, initial = '' }) {
  const [value, setValue] = useState(initial)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) onSave(value.trim())
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent2)' }}>🔑 Введите API токен</h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
          Для использования сервиса необходимо ввести API токен. Его можно найти в&nbsp;
          <a href="https://testuser1-task1-3847.infra.wsk17.dev/admin" target="_blank" rel="noreferrer">
            Admin Panel
          </a>
          .
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <input
            type="text"
            placeholder="Вставьте токен..."
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ width: '100%' }}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={!value.trim()}>
            Сохранить токен
          </button>
        </form>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}

const modal = {
  background: 'var(--bg2)',
  border: '1.5px solid var(--border)',
  borderRadius: '14px',
  padding: '2rem',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
}
