// src/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://my-finance-app-2026-production.up.railway.app/api';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const userId = this.getUserId();
        if (userId) {
          config.headers['user-id'] = userId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('authToken');
  }

  setUserId(userId: string | null) {
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // Auth
  async register(email: string, password: string, name: string): Promise<any> {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: any): Promise<any> {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  async verifyEmail(code: string): Promise<any> {
    const response = await this.api.post('/auth/verify-email', { code });
    return response.data;
  }

  async resendVerification(): Promise<any> {
    const response = await this.api.post('/auth/resend-verification', {});
    return response.data;
  }

  async verifyTwoFactor(email: string, code: string): Promise<any> {
    const response = await this.api.post('/auth/verify-2fa', { email, code });
    return response.data;
  }

  async requestPasswordReset(email: string): Promise<any> {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<any> {
    const response = await this.api.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  }

  async updatePinHash(pinHash: string): Promise<any> {
    const response = await this.api.put('/auth/pin', { pinHash });
    return response.data;
  }

  // Expenses
  async getExpenses(): Promise<any> {
    const response = await this.api.get('/expenses');
    return response.data;
  }

  async createExpense(data: any): Promise<any> {
    const response = await this.api.post('/expenses', data);
    return response.data;
  }

  async updateExpense(id: string, data: any): Promise<any> {
    const response = await this.api.put(`/expenses/${id}`, data);
    return response.data;
  }

  async deleteExpense(id: string): Promise<any> {
    const response = await this.api.delete(`/expenses/${id}`);
    return response.data;
  }

  // Goals
  async getGoals(): Promise<any> {
    const response = await this.api.get('/goals');
    return response.data;
  }

  async createGoal(data: any): Promise<any> {
    const response = await this.api.post('/goals', data);
    return response.data;
  }

  async updateGoal(id: string, data: any): Promise<any> {
    const response = await this.api.put(`/goals/${id}`, data);
    return response.data;
  }

  async deleteGoal(id: string): Promise<any> {
    const response = await this.api.delete(`/goals/${id}`);
    return response.data;
  }

  // Shopping Lists
  async getShoppingLists(): Promise<any> {
    const response = await this.api.get('/shopping-lists');
    return response.data;
  }

  async createShoppingList(data: any): Promise<any> {
    const response = await this.api.post('/shopping-lists', data);
    return response.data;
  }

  async updateShoppingList(id: string, data: any): Promise<any> {
    const response = await this.api.put(`/shopping-lists/${id}`, data);
    return response.data;
  }

  async deleteShoppingList(id: string): Promise<any> {
    const response = await this.api.delete(`/shopping-lists/${id}`);
    return response.data;
  }

  // Chat
  async getChatSessions(): Promise<any> {
    const response = await this.api.get('/chat/sessions');
    return response.data;
  }

  async createChatSession(name: string): Promise<any> {
    const response = await this.api.post('/chat/sessions', { name });
    return response.data;
  }

  async updateChatSession(id: string, name: string): Promise<any> {
    const response = await this.api.put(`/chat/sessions/${id}`, { name });
    return response.data;
  }

  async deleteChatSession(id: string): Promise<any> {
    const response = await this.api.delete(`/chat/sessions/${id}`);
    return response.data;
  }

  async getChatMessages(sessionId: string): Promise<any> {
    const response = await this.api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  }

  async createChatMessage(sessionId: string, content: string, isUser: boolean): Promise<any> {
    const response = await this.api.post(`/chat/sessions/${sessionId}/messages`, { content, isUser });
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<any> {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async createNotification(data: any): Promise<any> {
    const response = await this.api.post('/notifications', data);
    return response.data;
  }

  async markAllNotificationsRead(): Promise<any> {
    const response = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string): Promise<any> {
    const response = await this.api.delete(`/notifications/${id}`);
    return response.data;
  }
}

export const api = new ApiService();
