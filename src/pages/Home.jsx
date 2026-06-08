import React from 'react'
import { Link } from 'react-router-dom'

const SERVICES = [
  {
    name: 'ChatterBlast',
    path: '/chatterblast',
    icon: '💬',
    description: 'Интеллектуальный чат-бот. Ведите диалог и получайте ответы в реальном времени.',
    color: '#6c63ff',
  },
  {
    name: 'DreamWeaver',
    path: '/dreamweaver',
    icon: '🎨',
    description: 'Генератор изображений по текстовому описанию с поддержкой масштабирования.',
    color: '#ec4899',
  },
  {
    name: 'MindReader',
    path: '/mindreader',
    icon: '🔍',
    description: 'Распознавание объектов на изображениях с визуализацией результатов.',
    color: '#14b8a6',
  },
].sort((a, b) => a.name.localeCompare(b.name))

export default function Home() {
  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          AI Services
        </h1>
        <p style={{ color: 'var(--text2)' }}>Выберите сервис для начала работы</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
        {SERVICES.map(s => (
          <Link to={s.path} key={s.name} style={{ textDecoration: 'none' }}>
            <div style={card(s.color)}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.7rem' }}>{s.icon}</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.name}</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.5 }}>{s.description}</p>
              <div style={{ marginTop: '1.2rem', color: s.color, fontSize: '0.85rem', fontWeight: 600 }}>
                Открыть →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const card = (color) => ({
  background: 'var(--bg2)',
  border: `1.5px solid var(--border)`,
  borderRadius: '14px',
  padding: '1.6rem',
  transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
  cursor: 'pointer',
  height: '100%',
  // hover handled via CSS class would need a wrapper; inline style approximation:
  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
})
