import React, { useState, useRef, useEffect, useCallback } from 'react'
import { apiRequest, BASE_URL, getErrorMessage } from '../utils/api'
import ErrorBox from '../components/ErrorBox'
import TokenModal from '../components/TokenModal'

export default function DreamWeaver({ token, onTokenChange }) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [finalImage, setFinalImage] = useState(null) // { resource_id, image_url }
  const [currentResourceId, setCurrentResourceId] = useState(null)
  const [error, setError] = useState(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [imgOpacity, setImgOpacity] = useState(0)

  const pollingRef = useRef(null)

  const stopPolling = useCallback(() => {
    clearInterval(pollingRef.current)
    pollingRef.current = null
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const pollStatus = useCallback(async (jobId) => {
    try {
      const data = await apiRequest(`/api/imagegeneration/status/${jobId}`, {}, token)
      setProgress(data.progress || 0)

      if (data.image_url) {
        const url = data.image_url.startsWith('http') ? data.image_url : `${BASE_URL}${data.image_url}`
        setPreviewUrl(url)
        setImgOpacity(0)
        setTimeout(() => setImgOpacity(1), 50)
      }

      if (data.status === 'finished') {
        stopPolling()
        // Get final result
        const result = await apiRequest(`/api/imagegeneration/result/${jobId}`, {}, token)
        const finalUrl = result.image_url.startsWith('http') ? result.image_url : `${BASE_URL}${result.image_url}`
        setFinalImage({ resource_id: result.resource_id, image_url: finalUrl })
        setCurrentResourceId(result.resource_id)
        setPreviewUrl(null)
        setImgOpacity(0)
        setTimeout(() => setImgOpacity(1), 50)
        setIsGenerating(false)
        setProgress(100)
      }
    } catch (err) {
      stopPolling()
      setIsGenerating(false)
      const msg = getErrorMessage(err)
      setError(msg)
      if (err.status === 401) setShowTokenModal(true)
    }
  }, [token, stopPolling])

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    setError(null)
    setFinalImage(null)
    setPreviewUrl(null)
    setProgress(0)
    setIsGenerating(true)
    setCurrentResourceId(null)

    try {
      const data = await apiRequest('/api/imagegeneration/generate', {
        method: 'POST',
        body: JSON.stringify({ text_prompt: prompt.trim() }),
      }, token)

      const jobId = data.job_id
      pollingRef.current = setInterval(() => pollStatus(jobId), 2000)
      // immediate first poll
      pollStatus(jobId)
    } catch (err) {
      setIsGenerating(false)
      const msg = getErrorMessage(err)
      setError(msg)
      if (err.status === 401) setShowTokenModal(true)
    }
  }

  const handleImageAction = async (endpoint) => {
    if (!currentResourceId) return
    setError(null)
    setIsGenerating(true)
    setFinalImage(null)
    setPreviewUrl(null)
    setProgress(0)

    try {
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ resource_id: currentResourceId }),
      }, token)

      const jobId = data.job_id
      pollingRef.current = setInterval(() => pollStatus(jobId), 2000)
      pollStatus(jobId)
    } catch (err) {
      setIsGenerating(false)
      const msg = getErrorMessage(err)
      setError(msg)
      if (err.status === 401) setShowTokenModal(true)
    }
  }

  const handleSave = () => {
    if (!finalImage) return
    const a = document.createElement('a')
    a.href = finalImage.image_url
    a.download = `dreamweaver-${Date.now()}.png`
    a.target = '_blank'
    a.click()
  }

  const displayUrl = finalImage?.image_url || previewUrl

  return (
    <div>
      {showTokenModal && (
        <TokenModal
          initial={token}
          onSave={(t) => { onTokenChange(t); setShowTokenModal(false); setError(null) }}
        />
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🎨 DreamWeaver</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Генератор изображений по текстовому описанию</p>
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

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', alignItems: 'flex-end' }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Опишите желаемое изображение..."
          disabled={!token || isGenerating}
          rows={3}
          style={{ flex: 1, resize: 'none' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button className="btn-secondary" onClick={() => setPrompt('')} disabled={!token || !prompt || isGenerating} title="Очистить">✕</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={!token || isGenerating || !prompt.trim()}>
            {isGenerating ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '✨'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isGenerating && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text2)' }}>
            <span>Генерация изображения...</span>
            <span>{progress}%</span>
          </div>
          <div style={progressTrack}>
            <div style={{ ...progressBar, width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Image display */}
      {displayUrl && (
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={imageContainer}>
            <img
              src={displayUrl}
              alt="Generated"
              style={{
                maxWidth: '100%',
                maxHeight: '480px',
                borderRadius: '10px',
                opacity: imgOpacity,
                transition: 'opacity 0.6s ease',
                display: 'block',
                margin: '0 auto',
              }}
            />
            {isGenerating && (
              <div style={imgOverlay}>
                <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Предварительный просмотр...</span>
              </div>
            )}
          </div>

          {finalImage && !isGenerating && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleSave}>💾 Сохранить</button>
              <button className="btn-secondary" onClick={() => handleImageAction('/api/imagegeneration/upscale')}>
                ⬆ Улучшить качество
              </button>
              <button className="btn-secondary" onClick={() => handleImageAction('/api/imagegeneration/zoom/in')}>
                🔍+ Приблизить
              </button>
              <button className="btn-secondary" onClick={() => handleImageAction('/api/imagegeneration/zoom/out')}>
                🔍− Отдалить
              </button>
            </div>
          )}
        </div>
      )}

      {!displayUrl && !isGenerating && (
        <div style={{ background: 'var(--bg2)', border: '1.5px dashed var(--border)', borderRadius: '14px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</div>
            <div>Изображение появится здесь</div>
          </div>
        </div>
      )}
    </div>
  )
}

const progressTrack = {
  background: 'var(--bg3)',
  borderRadius: '99px',
  height: '8px',
  overflow: 'hidden',
  border: '1px solid var(--border)',
}

const progressBar = {
  background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
  height: '100%',
  borderRadius: '99px',
  transition: 'width 0.5s ease',
}

const imageContainer = {
  position: 'relative',
  background: 'var(--bg2)',
  border: '1.5px solid var(--border)',
  borderRadius: '14px',
  padding: '1rem',
  textAlign: 'center',
}

const imgOverlay = {
  position: 'absolute',
  bottom: '1.2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.6)',
  borderRadius: '6px',
  padding: '0.3rem 0.7rem',
}
