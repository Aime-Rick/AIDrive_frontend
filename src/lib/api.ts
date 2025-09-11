import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies to be sent and received
});

api.interceptors.request.use((config) => {
  // The backend uses httpOnly cookies for session management,
  // so we don't need to manually set Authorization headers.
  // 'withCredentials: true' handles this automatically.
  return config;
});

export default api;
