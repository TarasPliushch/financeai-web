import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const DEEPSEEK_API_KEY = 'sk-d07874cdcc1340ebabff7785d0d0d04b';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  messageCount?: number;
}

export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (currentSessionId) loadMessages(currentSessionId); }, [currentSessionId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  const loadSessions = async () => {
    try {
      const response = await api.getChatSessions();
      if (response.success && response.sessions) {
        const parsed = response.sessions.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) }));
        setSessions(parsed);
        if (parsed.length > 0 && !currentSessionId) setCurrentSessionId(parsed[0].id);
        else if (parsed.length === 0) await createNewSession();
      }
    } catch (error) { console.error(error); }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await api.getChatMessages(sessionId);
      if (response.success && response.messages) {
        setMessages(response.messages.map((m: any) => ({ id: m.id, content: m.content, isUser: m.isUser, timestamp: new Date(m.createdAt) })));
      }
    } catch (error) { console.error(error); }
  };

  const createNewSession = async () => {
    try {
      const response = await api.createChatSession(`Чат ${new Date().toLocaleDateString()}`);
      if (response.success && response.session) {
        const newSession = { ...response.session, createdAt: new Date(response.session.createdAt), updatedAt: new Date(response.session.updatedAt) };
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setShowSessions(false);
      }
    } catch (error) { toast.error('Помилка створення чату'); }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Видалити цей чат?')) return;
    try {
      await api.deleteChatSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const next = sessions.find(s => s.id !== sessionId);
        next ? setCurrentSessionId(next.id) : createNewSession();
      }
    } catch (error) { toast.error('Помилка видалення'); }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || isStreaming) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), content: text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    if (currentSessionId) await api.createChatMessage(currentSessionId, text, true);

    try {
      setIsStreaming(true);
      setStreamingText('');
      
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ти Lis — фінансовий асистент. Відповідай українською, використовуй емодзі.' },
            ...messages.slice(-8).map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: true,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) { fullResponse += content; setStreamingText(fullResponse); }
          } catch (e) {}
        }
      }

      const aiMessage: ChatMessage = { id: Date.now().toString(), content: fullResponse || 'Готово!', isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      if (currentSessionId) await api.createChatMessage(currentSessionId, aiMessage.content, false);
      
    } catch (error) {
      console.error('❌ Помилка AI:', error);
      const errorMsg = 'Вибач, сталася помилка. Спробуй ще раз.';
      setStreamingText(errorMsg);
      setMessages(prev => [...prev, { id: Date.now().toString(), content: errorMsg, isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-full bg-background rounded-xl overflow-hidden border border-white/10">
      {/* Sessions sidebar */}
      <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-background border-r border-white/10 transform transition-transform md:relative md:translate-x-0 ${showSessions ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-semibold">Історія чатів</h2>
            <button onClick={() => setShowSessions(false)} className="md:hidden p-1 rounded-lg hover:bg-white/10">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <div key={s.id} className={`group relative p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'}`} onClick={() => { setCurrentSessionId(s.id); setShowSessions(false); }}>
                <p className="font-medium text-sm truncate pr-8">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.lastMessage || 'Новий чат'}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(s.updatedAt, 'dd MMM, HH:mm', { locale: uk })}</p>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="absolute right-2 top-2 p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 3h6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/10">
            <button onClick={createNewSession} className="w-full py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90">+ Новий чат</button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button onClick={() => setShowSessions(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">☰</button>
          <h3 className="font-semibold flex-1">{currentSession?.name || 'Чат з AI'}</h3>
          <p className="text-xs text-muted-foreground">Lis — асистент</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-muted-foreground">Привіт! Я Lis, твій фінансовий асистент</p>
              <p className="text-sm text-muted-foreground mt-2">Можу додавати витрати, доходи, цілі та списки покупок за командою</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.isUser ? 'bg-primary text-white' : 'bg-white/10 border border-white/10'}`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <p className={`text-xs mt-1 ${m.isUser ? 'text-white/70' : 'text-muted-foreground'}`}>{format(m.timestamp, 'HH:mm')}</p>
              </div>
            </div>
          ))}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-white/10 border border-white/10">
                <p className="text-sm whitespace-pre-wrap">{streamingText}<span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1" /></p>
              </div>
            </div>
          )}
          {isLoading && !isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white/10">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Напишіть повідомлення..."
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={1}
              disabled={isLoading || isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading || isStreaming}
              className="px-5 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Enter — відправити</p>
        </div>
      </div>
    </div>
  );
};
