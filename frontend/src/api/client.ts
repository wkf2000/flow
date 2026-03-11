import axios from 'axios';

const apiKey = (window as any).__FLOW_CONFIG__?.apiKey || '';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey && { 'X-API-Key': apiKey }),
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
