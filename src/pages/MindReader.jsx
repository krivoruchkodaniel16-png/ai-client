import React, { useState, useRef, useCallback } from 'react'
import { apiRequest, getErrorMessage } from '../utils/api'
import ErrorBox from '../components/ErrorBox'
import TokenModal from '../components/TokenModal'

export default function MindReader({ token, onTokenChange }) {
  const [file, setFile] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [objects, setObjects] = useState(null)
  const [error, setError] = useState(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [imgDims, setImgDims] = useState({ w: 1, h: 1, nw: 1, nh: 1 })

  const imgRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setObjects(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewSrc(ev.target.result)
    reader.readAsDataURL(f)
  }

  const handleRecognize = async () => {
    if (!file) return
    setError(null)
    setIsLoading(true)
    setObjects(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const data = await apiRequest('/api/imagerecognition/recognize', {
        method: 'POST',
        body: formData,
        headers: {},
      }, token)
      setObjects(data.objects || [])
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      if (err.status === 401) setShowTokenModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImgLoad = () => {
    if (!imgRef.current) return
    const img = imgRef.current
    setImgDims({
      w: img.naturalWidth,
      h: img.naturalHeight,
      nw: img.width,
      nh: img.height,
    })
  }

  const scaleX = imgDims.nw / imgDims.w
  const scaleY = imgDims.nh / imgDims.h

  const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6']

  return (
    <div>
      {showTokenModal && (
        <TokenModal
          initial={token}
          onSave={(t) => { onTokenChange(t); setShowTokenModal(false); setError(null) }}
        />
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🔍 MindReader</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Распознавание объектов на изображениях</p>
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

      {/* File input */}
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <label style={fileLabel}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={!token || isLoading}
            style={{ display: 'none' }}
          />
          📁 {file ? file.name : 'Выбрать изображение'}
        </label>
        <button
          className="btn-primary"
          onClick={handleRecognize}
          disabled={!token || !file || isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="spinner" style={{ width: 16, height: 16 }} /> Анализируем...
            </span>
          ) : '🔍 Распознать объекты'}
        </button>
      </div>

      {/* Image + bounding boxes */}
      {previewSrc && (
        <div style={{ marginBottom: '1.2rem' }}>
          {objects !== null && (
            <div style={{ marginBottom: '0.7rem', padding: '0.6rem 1rem', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.9rem' }}>
              {objects.length === 0
                ? '😔 Объекты не найдены'
                : `✅ Распознано объектов: ${objects.length}`}
            </div>
          )}

          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img
              ref={imgRef}
              src={previewSrc}
              alt="Upload"
              onLoad={handleImgLoad}
              style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '10px', display: 'block', border: '1.5px solid var(--border)' }}
            />

            {objects && objects.map((obj, i) => {
              const color = COLORS[i % COLORS.length]
              const bb = obj.bounding_box
              if (!bb) return null
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: bb.x * scaleX,
                    top: bb.y * scaleY,
                    width: bb.width * scaleX,
                    height: bb.height * scaleY,
                    border: `2px solid ${color}`,
                    background: `${color}22`,
                    borderRadius: '3px',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    background: color,
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '2px 0 4px 0',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    {obj.name} {obj.probability !== undefined ? `${Math.round(obj.probability * 100)}%` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!previewSrc && (
        <div style={{ background: 'var(--bg2)', border: '1.5px dashed var(--border)', borderRadius: '14px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
            <div>Загрузите изображение для анализа</div>
          </div>
        </div>
      )}
    </div>
  )
}

const fileLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'var(--bg3)',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--text)',
  transition: 'border-color 0.18s',
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
