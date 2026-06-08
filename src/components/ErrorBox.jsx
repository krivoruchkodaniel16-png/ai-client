import React from 'react'

export default function ErrorBox({ message, onRequestToken }) {
  const needsToken = message && message.includes('токен')
  return (
    <div className="error-box">
      <span style={{ fontSize: '1.1rem' }}>⚠️</span>
      <div>
        <div>{message}</div>
        {needsToken && onRequestToken && (
          <button className="btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.82rem' }} onClick={onRequestToken}>
            Ввести новый токен
          </button>
        )}
      </div>
    </div>
  )
}
