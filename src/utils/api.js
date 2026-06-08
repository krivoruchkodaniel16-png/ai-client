export const BASE_URL = 'https://testuser1-task1-3847.infra.wsk17.dev'

export async function apiRequest(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-API-TOKEN': token } : {}),
    ...(options.headers || {}),
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const err = new Error(errData.detail || errData.title || `Error ${res.status}`)
    err.status = res.status
    err.data = errData
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}

export function getErrorMessage(err) {
  if (!err.status) return 'Ошибка сети. Проверьте подключение.'
  if (err.status === 400) return 'Неверный запрос. Проверьте введённые данные.'
  if (err.status === 401) return 'Недействительный API токен. Введите новый токен.'
  if (err.status === 403) return 'Квота исчерпана. Подождите до следующего месяца или увеличьте квоту.'
  if (err.status === 503) return 'Сервис временно недоступен. Попробуйте позже.'
  return err.message || 'Произошла неизвестная ошибка.'
}
