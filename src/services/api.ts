import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = 'https://my-finance-app-2026-production.up.railway.app/api';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = this.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      const userId = this.getUserId();
      if (userId) config.headers['user-id'] = userId;
      return config;
    });
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('authToken', token);
    else localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('authToken');
  }

  setUserId(userId: string | null) {
    if (userId) localStorage.setItem('userId', userId);
    else localStorage.removeItem('userId');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // ==================== AUTH ====================
  async register(email: string, password: string, name: string) {
    const res = await this.api.post('/auth/register', { email, password, name });
    return res.data;
  }

  async login(email: string, password: string) {
    const res = await this.api.post('/auth/login', { email, password });
    return res.data;
  }

  async getCurrentUser() {
    const res = await this.api.get('/auth/me');
    return res.data;
  }

  async updateProfile(data: any) {
    const res = await this.api.put('/auth/profile', data);
    return res.data;
  }

  async verifyEmail(code: string) {
    const res = await this.api.post('/auth/verify-email', { code });
    return res.data;
  }

  async resendVerification() {
    const res = await this.api.post('/auth/resend-verification', {});
    return res.data;
  }

  async verifyTwoFactor(email: string, code: string) {
    const res = await this.api.post('/auth/verify-2fa', { email, code });
    return res.data;
  }

  async requestPasswordReset(email: string) {
    const res = await this.api.post('/auth/forgot-password', { email });
    return res.data;
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const res = await this.api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  }

  // ==================== EXPENSES ====================
  async getExpenses() {
    const res = await this.api.get('/expenses');
    return res.data;
  }

  async createExpense(data: any) {
    const res = await this.api.post('/expenses', data);
    return res.data;
  }

  async updateExpense(id: string, data: any) {
    const res = await this.api.put(`/expenses/${id}`, data);
    return res.data;
  }

  async deleteExpense(id: string) {
    const res = await this.api.delete(`/expenses/${id}`);
    return res.data;
  }

  // ==================== GOALS ====================
  async getGoals() {
    const res = await this.api.get('/goals');
    return res.data;
  }

  async createGoal(data: any) {
    const res = await this.api.post('/goals', data);
    return res.data;
  }

  async updateGoal(id: string, data: any) {
    const res = await this.api.put(`/goals/${id}`, data);
    return res.data;
  }

  async deleteGoal(id: string) {
    const res = await this.api.delete(`/goals/${id}`);
    return res.data;
  }

  // ==================== SHOPPING LISTS ====================
  async getShoppingLists() {
    const res = await this.api.get('/shopping/lists');
    return res.data;
  }

  async createShoppingList(data: any) {
    const res = await this.api.post('/shopping/lists', data);
    return res.data;
  }

  async updateShoppingList(id: string, data: any) {
    const res = await this.api.put(`/shopping/lists/${id}`, data);
    return res.data;
  }

  async deleteShoppingList(id: string) {
    const res = await this.api.delete(`/shopping/lists/${id}`);
    return res.data;
  }

  async addShoppingItem(listId: string, data: any) {
    const res = await this.api.post(`/shopping/lists/${listId}/items`, data);
    return res.data;
  }

  async updateShoppingItem(itemId: string, data: any) {
    const res = await this.api.put(`/shopping/items/${itemId}`, data);
    return res.data;
  }

  async deleteShoppingItem(itemId: string) {
    const res = await this.api.delete(`/shopping/items/${itemId}`);
    return res.data;
  }

  // ==================== CHAT ====================
  async getChatSessions() {
    const res = await this.api.get('/chat/sessions');
    return res.data;
  }

  async createChatSession(name: string) {
    const res = await this.api.post('/chat/sessions', { name });
    return res.data;
  }

  async updateChatSession(id: string, name: string) {
    const res = await this.api.put(`/chat/sessions/${id}`, { name });
    return res.data;
  }

  async deleteChatSession(id: string) {
    const res = await this.api.delete(`/chat/sessions/${id}`);
    return res.data;
  }

  async getChatMessages(sessionId: string) {
    const res = await this.api.get(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  }

  async createChatMessage(sessionId: string, content: string, isUser: boolean) {
    const res = await this.api.post(`/chat/sessions/${sessionId}/messages`, { content, isUser });
    return res.data;
  }

  // ==================== NOTIFICATIONS ====================
  async getNotifications() {
    const res = await this.api.get('/notifications');
    return res.data;
  }

  async createNotification(data: any) {
    const res = await this.api.post('/notifications', data);
    return res.data;
  }

  async markAllNotificationsRead() {
    const res = await this.api.put('/notifications/read-all');
    return res.data;
  }

  async deleteNotification(id: string) {
    const res = await this.api.delete(`/notifications/${id}`);
    return res.data;
  }
}

export const api = new ApiService();
