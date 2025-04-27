import axios from 'axios';

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (token expired/invalid)
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Handle forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Handle not found
          console.error('Resource not found');
          break;
        case 500:
          // Handle server error
          console.error('Server error');
          break;
        default:
          console.error('An error occurred');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    // Store auth data immediately after successful login
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },
  
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { 
      email, 
      password, 
      full_name: name 
    });
    // Store auth data immediately after successful registration
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },
};

// Document API
export const documentApi = {
  upload: async (formData: FormData) => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  list: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

// Payment API
export const paymentApi = {
  request: async (amount: string, phoneNumber: string, payerMessage: string, payeeNote: string) => {
    const response = await api.post('/payments/request', {
      amount,
      phone_number: phoneNumber,
      payer_message: payerMessage,
      payee_note: payeeNote,
    });
    return response.data;
  },

  checkStatus: async (referenceId: string) => {
    const response = await api.get(`/payments/status/${referenceId}`);
    return response.data;
  },
};

export default api; 