// src/components/chat/ChatView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = 'sk-d07874cdcc1340ebabff7785d0d0d04b';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const ChatView: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await api.getChatSessions();
      if (response.success && response.sessions) {
        const parsedSessions = response.sessions.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: [],
        }));
        setSessions(parsedSessions);
        if (parsedSessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(parsedSessions[0].id);
        } else if (parsedSessions.length === 0) {
          createNewSession();
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await api.getChatMessages(sessionId);
      if (response.success && response.messages) {
        const parsedMessages = response.messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          isUser: m.isUser,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await api.createChatSession(`Чат ${new Date().toLocaleDateString()}`);
      if (response.success && response.session) {
        const newSession: ChatSession = {
          ...response.session,
          createdAt: new Date(response.session.createdAt),
          updatedAt: new Date(response.session.updatedAt),
          messages: [],
        };
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setShowSessions(false);
      }
    } catch (error) {
      toast.error('Помилка створення чату');
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Save user message to server
    if (currentSessionId) {
      try {
        await api.createChatMessage(currentSessionId, text, true);
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    }

    // Send to DeepSeek AI
    await sendToAI(text);
  };

  const sendToAI = async (userMessage: string) => {
    setIsStreaming(true);
    setStreamingText('');

    const systemPrompt = `Ти Lis — розумний фінансовий асистент. Ти дівчина, дружня, емпатична, турботлива. Завжди відповідай українською.
Використовуй емодзі: 🎉 ✨ 💰 📊 💡 🎯

Ти допомагаєш користувачеві з:
- Аналізом витрат та доходів
- Плануванням бюджету
- Відстеженням фінансових цілей
- Порадами щодо економії
- Пошуком цін в інтернеті (використовуй DuckDuckGo API)

Якщо користувач просить додати витрату/дохід або створити ціль — скажи, що додано, але для реального додавання потрібно використовувати відповідний розділ програми.`;

    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.content,
    }));

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    };

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              setStreamingText(fullResponse);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      // Save AI response
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: fullResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (currentSessionId) {
        await api.createChatMessage(currentSessionId, fullResponse, false);
      }

    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage = 'Вибач, сталася помилка. Спробуй ще раз.';
      setStreamingText(errorMessage);
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Видалити цей чат?')) return;
    try {
      await api.deleteChatSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const nextSession = sessions.find(s => s.id !== sessionId);
        if (nextSession) {
          setCurrentSessionId(nextSession.id);
        } else {
          createNewSession();
        }
      }
      toast.success('Чат видалено');
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background rounded-xl overflow-hidden border border-border">
      {/* Sessions Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-80 bg-secondary/95 backdrop-blur-lg transform transition-transform duration-300 md:relative md:translate-x-0 md:block ${
          showSessions ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold">Історія чатів</h2>
            <button
              onClick={() => setShowSessions(false)}
              className="md:hidden p-1 hover:bg-secondary rounded-lg"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-primary/20 border border-primary/30'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setShowSessions(false);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.lastMessage || 'Новий чат'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(session.updatedAt, 'dd MMM, HH:mm', { locale: uk })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <button
              onClick={createNewSession}
              className="w-full py-2 rounded-lg bg-primary text-white hover:opacity-90"
            >
              + Новий чат
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <button
            onClick={() => setShowSessions(true)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg"
          >
            ☰
          </button>
          <div className="flex-1">
            <h3 className="font-semibold">{currentSession?.name || 'Чат з AI'}</h3>
            <p className="text-xs text-muted-foreground">Lis — фінансовий асистент</p>
          </div>
          {currentSessionId && (
            <button
              onClick={() => {
                if (confirm('Очистити історію чату?')) {
                  // Clear messages locally
                  setMessages([]);
                }
              }}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-muted-foreground">Вітаю! Я Lis, твій фінансовий асистент</p>
              <p className="text-sm text-muted-foreground mt-2">
                Можу проаналізувати витрати, допомогти з бюджетом або просто поговорити
              </p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.isUser
                    ? 'bg-primary text-white'
                    : 'bg-secondary/50 border border-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${message.isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {format(message.timestamp, 'HH:mm')}
                </p>
              </div>
            </div>
          ))}

          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-secondary/50 border border-border">
                <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              </div>
            </div>
          )}

          {isLoading && !isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2 bg-secondary/50">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Напишіть повідомлення..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={1}
              disabled={isLoading || isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading || isStreaming}
              className="px-5 py-3 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Натисніть Enter для відправки, Shift+Enter для нового рядка
          </p>
        </div>
      </div>
    </div>
  );
};
