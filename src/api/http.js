import axios from 'axios';
import { useAlert } from '../utils/AlertUtil';

const { notifySuccess, notifyError } = useAlert

const api = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'https://expense-tracker-api-44nm.onrender.com/api',
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (
//             (error.response?.status === 401 || error.response?.status === 403) &&
//             !originalRequest._retry
//         ) {
//             originalRequest._retry = true;

//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     failedQueue.push({ resolve, reject });
//                 })
//                     .then(token => {
//                         originalRequest.headers.Authorization = `Bearer ${token}`;
//                         return api(originalRequest);
//                     })
//                     .catch(err => Promise.reject(err));
//             }

//             isRefreshing = true;

//             try {
//                 const { data } = await api.post('/refresh');

//                 // Update localStorage token
//                 const oldAuth = JSON.parse(localStorage.getItem('auth')) || {};
//                 localStorage.setItem('auth', JSON.stringify({ ...oldAuth, token: data.token }));

//                 // Update axios default Authorization header for future requests
//                 api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

//                 processQueue(null, data.token);

//                 notifySuccess('Re-authentication successful');

//                 // Update original request header
//                 originalRequest.headers.Authorization = `Bearer ${data.token}`;

//                 return api(originalRequest);
//             } catch (err) {
//                 notifyError('Failed to Re-authenticate');
//                 processQueue(err, null);

//                 localStorage.removeItem('auth');
//                 window.location.reload();

//                 return Promise.reject(err);
//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// Response interceptor → handle expired or invalid token
// Handle expired/invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth');
            notifyError('Session expired. Please log in again.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
