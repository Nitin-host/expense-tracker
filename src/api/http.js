import axios from 'axios';
import { useAlert } from '../utils/AlertUtil';

const { notifySuccess, notifyError } = useAlert

const api = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    baseURL: import.meta.env.VITE_API_URL || 'https://expense-tracker-api-44nm.onrender.com/api',
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        error ? prom.reject(error) : prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
            const parsed = JSON.parse(storedAuth);
            if (parsed.token) {
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Check for both 401 and 403 responses
        if (
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                // Use POST and correct refresh endpoint!
                const { data } = await api.post('/refresh');
                processQueue(null, data.token);

                // Update localStorage
                localStorage.setItem('auth', JSON.stringify({ ...JSON.parse(localStorage.getItem('auth')), token: data.token }));

                notifySuccess('Re-authentication successful')
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (err) {
                notifyError('Failed to Re-authenticated')
                processQueue(err, null);
                localStorage.removeItem('auth');
                window.location.reload();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
