import { getAccessToken, setAccessToken, clearAccessToken } from './authToken.js';

const API_BASE = '/api';

// флаг для того чтобы знать есть запрос или нет (запрос на оплучение новго токена)
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise; // если уже обновляем то ждём

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // отправляем HttpOnly cookie с рефреш токеном
      });

      if (!res.ok) {
        clearAccessToken();
        throw new Error('refresh ошибка');
      }

      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    } finally {
      refreshPromise = null; // сброс фалага
    }
  })();

  return refreshPromise;
}

export async function apiFetch(endpoint, options = {}) {
  const headers = { ...options.headers };
  const token = getAccessToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // отправляем и принимаем cookie
  });

  // если сервер ответил 401 (Unauthorized) то пробуем обновить токен
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;

      // повторяем исходный запрос с новым токеном
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (err) {
      // если тут, значит рефреш токен высох значит перенаправляем
      throw new Error('refresh токен истек');
    }
  }

  return res;
}
