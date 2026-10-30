import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch } from '../utils/apiFetch';
import { setAccessToken, clearAccessToken } from '../utils/authToken.js';

export const ROLES = {
  USER: 'User',
  CINEMA_COMPANY: 'CinemaCompany'
}

const API_BASE_URL = 'http://localhost:3000/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // тут пока что простойц fetch

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            let errorMessage = 'Ошибка входа';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          setAccessToken(data.accessToken);

          const profileResult = await get().getCurrentUser();

          if (profileResult.success) {
            return { success: true, user: profileResult.user };
          } else {
            return { success: true, user: null, message: 'Вход выполнен' };
          }
        } catch (error) {
          set({ error: error.message, isLoading: false, isAuthenticated: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const registerData = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role === 'CinemaCompany' ? 'CinemaCompany' : 'User'
          };

          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(registerData)
          });

          if (!response.ok) {
            let errorMessage = 'Ошибка регистрации';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          try {
            const loginResult = await get().login(userData.email, userData.password);
            if (loginResult.success) {
              return { success: true, user: loginResult.user };
            }
          } catch (loginError) {
            console.log('Авто-логин не удался:', loginError.message);
          }

          return {
            success: true,
            user: null,
            message: 'Регистрация успешна! Теперь войдите в систему.'
          };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          });
        } finally {
          clearAccessToken();
          set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        }
      },

      // users

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/users/profile');

          if (!response.ok) {
            if (response.status === 401) {
              set({ isAuthenticated: false });
              throw new Error('Требуется авторизация');
            }
            let errorMessage = 'Ошибка получения профиля';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const userData = await response.json();
          set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
          return { success: true, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false, isAuthenticated: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      getUserProfile: async (username) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/users/${username}`);

          if (!response.ok) {
            let errorMessage = 'Ошибка получения профиля';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const userData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, user: userData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      getUsers: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/users');

          if (!response.ok) {
            let errorMessage = 'Ошибка получения пользователей';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const usersData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, data: usersData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка обновления профиля');
          }

          set((state) => ({
            user: { ...state.user, ...userData },
            isLoading: false,
            error: null
          }));
          return { success: true, user: data.user || userData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/users/avatar', {
            method: 'POST',
            headers: {
              'X-Filename': encodeURIComponent(file.name),
              'Content-Type': 'application/octet-stream'
            },
            body: file
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка загрузки аватара');
          }

          set((state) => ({
            user: { ...state.user, avatar_url: data.avatarUrl || data.image || data.url },
            isLoading: false,
            error: null
          }));
          return { success: true, avatarUrl: data.avatarUrl || data.image || data.url };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // articles

      getArticles: async (params = {}) => {
        set({ isLoading: true, error: null });

        try {
          const queryParams = new URLSearchParams();
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
              queryParams.append(key, params[key]);
            }
          });

          const response = await apiFetch(`/articles?${queryParams}`);

          if (!response.ok) {
            let errorMessage = 'Ошибка получения статей';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const articlesData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, data: articlesData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      getArticle: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${id}`);

          if (!response.ok) {
            let errorMessage = 'Ошибка получения статьи';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const articleData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, data: articleData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      createArticle: async (articleData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleData)
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка создания статьи');
          }

          set({ isLoading: false, error: null });
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      updateArticle: async (id, articleData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(articleData)
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка обновления статьи');
          }

          set({ isLoading: false, error: null });
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      deleteArticle: async (articleId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${articleId}`, { method: 'DELETE' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при удалении статьи');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      uploadArticleImage: async (articleId, file) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${articleId}/image`, {
            method: 'POST',
            headers: {
              'X-Filename': encodeURIComponent(file.name),
              'Content-Type': 'application/octet-stream'
            },
            body: file
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка загрузки изображения');
          }

          set({ isLoading: false, error: null });
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      deleteArticleImage: async (articleId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${articleId}/image`, { method: 'DELETE' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при удалении изображения');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      likeArticle: async (articleId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${articleId}/like`, { method: 'POST' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при лайке');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      unlikeArticle: async (articleId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/articles/${articleId}/like`, { method: 'DELETE' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при удалении лайка');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // comments

      addComment: async (articleId, content) => {
        set({ isLoading: true, error: null });

        try {
          if (!content || content.trim().length === 0) {
            throw new Error('Комментарий не может быть пустым');
          }

          const response = await apiFetch('/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: content.trim(),
              articleId: parseInt(articleId)
            })
          });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при добавлении комментария');
          }

          const newCommentData = {
            id: result.comment?.id || Date.now(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            author: {
              id: get().user?.id,
              userName: get().user?.name,
              avatar: get().user?.avatar_url
            }
          };

          set({ isLoading: false, error: null });
          return { success: true, data: newCommentData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      deleteComment: async (commentId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при удалении комментария');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // tags

      getTags: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/tags');

          if (!response.ok) {
            let errorMessage = 'Ошибка получения тегов';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const tagsData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, data: tagsData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // events

      getEvents: async (date = null) => {
        set({ isLoading: true, error: null });

        try {
          const queryParams = new URLSearchParams();
          if (date) queryParams.append('date', date);

          const response = await apiFetch(`/events?${queryParams}`);

          if (!response.ok) {
            let errorMessage = 'Ошибка получения событий';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const eventsData = await response.json();
          set({ isLoading: false, error: null });
          return { success: true, data: eventsData };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      createEvent: async (eventData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch('/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...eventData,
              created_at: new Date().toISOString()
            })
          });

          let data = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok) {
            throw new Error(data.message || 'Ошибка создания события');
          }

          set({ isLoading: false, error: null });
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      deleteEvent: async (eventId) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiFetch(`/events/${eventId}`, { method: 'DELETE' });

          let result = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
          }

          if (!response.ok) {
            throw new Error(result.message || 'Ошибка при удалении события');
          }

          set({ isLoading: false, error: null });
          return { success: true, data: result };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // utiils

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        const { getCurrentUser } = get();
        try {
          const result = await getCurrentUser();
          if (!result.success) {
            get().logout();
          }
        } catch {
          get().logout();
        }
      },

      isCompany: () => {
        const { user } = get();
        return user?.role === 1;
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 0;
      },

      checkServerHealth: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/health`);
          if (response.ok) {
            let data = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
            }
            return { success: true, data };
          }
          return { success: false, error: 'Сервер недоступен' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      version: 2
    }
  )
);

export default useAuthStore;