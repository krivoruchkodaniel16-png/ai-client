import React, { useState, useRef, useEffect, useCallback } from 'react'
import { apiRequest, getErrorMessage } from '../utils/api'
import ErrorBox from '../components/ErrorBox'
import TokenModal from '../components/TokenModal'

export default function ChatterBlast({ token, onTokenChange }) {
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([]) // [{role:'user'|'bot', text, final}]
  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState(null)
  const [showTokenModal, setShowTokenModal] = useState(false)

  const pollingRef = useRef(null)
  const displayedRef = useRef('') // how many chars of current bot message displayed
  const targetTextRef = useRef('')
  const typingRef = useRef(null)
  const messagesEndRef = useRef(null)
  const isFinalRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const stopAll = useCallback(() => {
    clearInterval(pollingRef.current)
    clearTimeout(typingRef.current)
    pollingRef.current = null
    typingRef.current = null
  }, [])

  const typeNextChar = useCallback(() => {
    const target = targetTextRef.current
    const displayed = displayedRef.current

    if (displayed.length < target.length) {
      displayedRef.current = target.slice(0, displayed.length + 1)
      const isFinal = isFinalRef.current && displayedRef.current.length >= target.length

      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'bot') {
          updated[updated.length - 1] = {
            ...last,
            text: displayedRef.current,
            typing: !isFinal,
          }
        }
        return updated
      })

      if (isFinal) {
        setIsWaiting(false)
        stopAll()
        return
      }

      const delay = Math.floor(Math.random() * (20 - 2 + 1)) + 2
      typingRef.current = setTimeout(typeNextChar, delay)
    } else if (isFinalRef.current) {
      // All chars displayed and final
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'bot') {
          updated[updated.length - 1] = { ...last, typing: false }
        }
        return updated
      })
      setIsWaiting(false)
      stopAll()
    } else {
      // waiting for more text from polling
      typingRef.current = setTimeout(typeNextChar, 100)
    }
  }, [stopAll])

  const startTyping = useCallback(() => {
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(typeNextChar, 10)
  }, [typeNextChar])

  const pollResponse = useCallback(async (convId) => {
    try {
      const data = await apiRequest(`/api/chat/conversation/${convId}`, {}, token)
      const newText = data.response || ''
      const wasShorter = newText.length > targetTextRef.current.length
      targetTextRef.current = newText
      isFinalRef.current = data.is_final

      if (wasShorter && typingRef.current === null) {
        startTyping()
      }

      if (data.is_final) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    } catch (err) {
      stopAll()
      setIsWaiting(false)
      setError(getErrorMessage(err))
    }
  }, [token, startTyping, stopAll])

  const handleSend = async () => {
    if (!input.trim() || isWaiting) return
    setError(null)

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])

    // Add placeholder bot message
    displayedRef.current = ''
    targetTextRef.current = ''
    isFinalRef.current = false
    setMessages(prev => [...prev, { role: 'bot', text: '', typing: true }])
    setIsWaiting(true)

    try {
      let data
      if (conversationId) {
        data = await apiRequest(`/api/chat/conversation/${conversationId}`, {
          method: 'PUT',
          body: JSON.stringify({ prompt: userText }),
        }, token)
      } else {
        data = await apiRequest('/api/chat/conversation', {
          method: 'POST',
          body: JSON.stringify({ prompt: userText }),
        }, token)
        setConversationId(data.conversation_id)
      }

      const convId = data.conversation_id
      setConversationId(convId)

      const newText = data.response || ''
      targetTextRef.current = newText
      isFinalRef.current = data.is_final
      startTyping()

      if (!data.is_final) {
        pollingRef.current = setInterval(() => pollResponse(convId), 1000)
      }
    } catch (err) {
      stopAll()
      setIsWaiting(false)
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'bot' && last.text === '') {
          updated.pop()
        }
        return updated
      })
      const msg = getErrorMessage(err)
      setError(msg)
      if (err.status === 401) setShowTokenModal(true)
    }
  }

  const handleNewConversation = () => {
    stopAll()
    setConversationId(null)
    setMessages([])
    setInput('')
    setIsWaiting(false)
    setError(null)
    displayedRef.current = ''
    targetTextRef.current = ''
    isFinalRef.current = false
  }

  useEffect(() => () => stopAll(), [stopAll])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div>
      {showTokenModal && (
        <TokenModal
          initial={token}
          onSave={(t) => { onTokenChange(t); setShowTokenModal(false); setError(null) }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>💬 ChatterBlast</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Интеллектуальный чат-бот</p>
        </div>
        <button className="btn-secondary" onClick={handleNewConversation}>
          🔄 Новый разговор
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <ErrorBox message={error} onRequestToken={() => setShowTokenModal(true)} />
        </div>
      )}

      {!token && (
        <div className="error-box" style={{ marginBottom: '1rem' }}>
          <span>⚠️</span>
          <div>
            Введите API токен для использования сервиса.{' '}
            <button className="btn-secondary" style={{ fontSize: '0.82rem', marginLeft: '0.5rem' }} onClick={() => setShowTokenModal(true)}>
              Ввести токен
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div style={chatBox}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text2)', marginTop: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
            <div>Начните разговор...</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={msgRow(msg.role)}>
            <div style={bubble(msg.role)}>
              {msg.text}
              {msg.typing && <span className="blink" style={{ marginLeft: '1px', borderRight: '2px solid currentColor', paddingRight: '1px' }} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', marginTop: '0.8rem' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение... (Enter для отправки)"
          disabled={!token || isWaiting}
          rows={2}
          style={{ flex: 1, resize: 'none' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button
            className="btn-secondary"
            onClick={() => setInput('')}
            disabled={!token || !input}
            title="Очистить"
          >✕</button>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!token || isWaiting || !input.trim()}
          >
            {isWaiting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}

const chatBox = {
  background: 'var(--bg2)',
  border: '1.5px solid var(--border)',
  borderRadius: '14px',
  padding: '1.2rem',
  minHeight: '320px',
  maxHeight: '480px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
}

const msgRow = (role) => ({
  display: 'flex',
  justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
})

const bubble = (role) => ({
  background: role === 'user' ? 'var(--accent)' : 'var(--bg3)',
  border: role === 'user' ? 'none' : '1.5px solid var(--border)',
  borderRadius: role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
  padding: '0.7rem 1rem',
  maxWidth: '75%',
  fontSize: '0.95rem',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
})
