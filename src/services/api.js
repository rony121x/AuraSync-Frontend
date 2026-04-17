import axios from 'axios';

// The baseURL now dynamically looks at your environment variables!
const API = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL}/api` 
});

export const auth = {
  register: (data) => API.post('/auth/register', data),
  scanFace: (data) => API.post('/auth/scan-face', data),
  verify: (data) => API.post('/auth/verify-password', data),
};

export const attendance = {
  getSessions: () => API.get('/attendance/session'),
  toggleSession: (data) => API.post('/attendance/session', data),
  markPresent: (data) => API.post('/attendance/mark', data),
}

export const dashboard = {
  getAnalytics: (role, email) => API.get(`/analytics?role=${role}&email=${email}`),
}
