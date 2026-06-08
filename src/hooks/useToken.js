import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ai_client_api_token'

export function useToken() {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY) || '')

  const setToken = useCallback((t) => {
    const trimmed = t.trim()
    setTokenState(trimmed)
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return [token, setToken]
}
