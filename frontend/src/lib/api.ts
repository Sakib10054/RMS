
import axios from 'axios';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').trim().replace(/\/+$/, '');
const API_BASE_URL = `${API_ORIGIN}/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
});

// Attach JWT token to requests.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('restaurant_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Let Axios/browser set Content-Type automatically for FormData.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (
            config.data &&
            typeof config.data === 'object' &&
            !(config.data instanceof Blob)
        ) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Normalize API errors.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as
                | {
                message?: unknown;
                error?: unknown;
                messages?: Record<string, unknown>;
            }
                | string
                | undefined;

            let message = 'Something went wrong. Please try again.';

            if (typeof data === 'string' && data.trim()) {
                message = data;
            } else if (data && typeof data === 'object') {
                if (data.message) {
                    message = String(data.message);
                } else if (
                    data.messages &&
                    typeof data.messages === 'object'
                ) {
                    const details = Object.entries(data.messages)
                        .map(([field, value]) => `${field}: ${String(value)}`)
                        .join(' | ');

                    message =
                        details ||
                        String(data.error ?? error.message ?? message);
                } else if (data.error) {
                    message = String(data.error);
                } else {
                    message = error.message || message;
                }
            } else {
                message = error.message || message;
            }

            return Promise.reject(new Error(message));
        }

        return Promise.reject(error);
    },
);
