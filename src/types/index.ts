// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatarEmoji?: string;
  currency?: string;
  monthlyBudget?: number;
  notificationsEnabled?: boolean;
  theme?: string;
  language?: string;
  description?: string;
  pinHash?: string;
  isEmailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  requires2FA?: boolean;
  requiresVerification?: boolean;
  message?: string;
  error?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  isIncome: boolean;
  currency: string;
  serverId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageEmoji: string;
  notes?: string;
  deadline?: Date;
  currency: string;
  serverId?: string;
  progress: number;
  isCompleted: boolean;
  remaining: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  isCompleted: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  reminderDate?: Date;
  reminderLeadMinutes: number;
  createdAt: Date;
  serverId?: string;
  completedCount: number;
  totalCount: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  messageCount: number;
  serverId?: string;
}

export type NotificationType = 
  | 'expenseAdded'
  | 'expenseEdited'
  | 'incomeAdded'
  | 'incomeEdited'
  | 'goalAdded'
  | 'goalCompleted'
  | 'goalProgress'
  | 'goalEdited';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: Date;
  type: NotificationType;
  isRead: boolean;
}
