import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];
let onTokensUpdated = null;

/** Register a callback so silent refresh can sync Redux (avoids circular imports). */
export function setAuthTokenSync(handler) {
    onTokensUpdated = handler;
}

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

const readAuth = () => {
    try {
        return JSON.parse(localStorage.getItem('auth') || 'null');
    } catch {
        return null;
    }
};

const writeAuthToken = (token, refreshToken) => {
    const oldAuth = readAuth() || {};
    const next = {
        ...oldAuth,
        token,
        ...(refreshToken ? { refreshToken } : {}),
    };
    localStorage.setItem('auth', JSON.stringify(next));
    if (typeof onTokensUpdated === 'function') {
        onTokensUpdated({ token, refreshToken: refreshToken || next.refreshToken });
    }
};

api.interceptors.request.use(
    (config) => {
        const storedAuth = readAuth();
        if (storedAuth?.token) {
            config.headers.Authorization = `Bearer ${storedAuth.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status !== 401 || !originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (
            originalRequest.url?.includes('/login') ||
            originalRequest.url?.includes('/refresh')
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const auth = readAuth();
        const refreshToken = auth?.refreshToken;

        if (!refreshToken) {
            localStorage.removeItem('auth');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        isRefreshing = true;
        try {
            const { data } = await api.post('/refresh', { refreshToken });
            writeAuthToken(data.token, data.refreshToken);
            processQueue(null, data.token);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return api(originalRequest);
        } catch (refreshErr) {
            processQueue(refreshErr, null);
            localStorage.removeItem('auth');
            window.location.href = '/login';
            return Promise.reject(refreshErr);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
