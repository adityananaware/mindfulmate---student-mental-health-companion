import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User as UserIcon, 
  LogOut, 
  Moon, 
  Sun, 
  Trash2, 
  History, 
  MessageCircle, 
  Heart, 
  Wind, 
  Coffee, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { format } from 'date-fns';
import { analyzeSentimentAndRespond } from './services/geminiService';
import { cn } from './lib/utils';
import { User, Message, MoodEntry } from './types';

const MOOD_EMOJIS: Record<string, string> = {
  Happy: '😊',
  Neutral: '😐',
  Stressed: '😟',
  Sad: '😢',
  Anxious: '😰',
  Angry: '😠',
};

const MOOD_VALUES: Record<string, number> = {
  Happy: 5,
  Neutral: 3,
  Stressed: 2,
  Sad: 1,
  Anxious: 1.5,
  Angry: 1,
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [chatRes, moodRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/moods')
      ]);
      if (chatRes.ok) setMessages(await chatRes.json());
      if (moodRes.ok) setMoodHistory(await moodRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        fetchData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMessages([]);
    setMoodHistory([]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Save user message
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userMessage),
    });

    const response = await analyzeSentimentAndRespond(input, messages.map(m => ({ role: m.role, content: m.content })));
    
    const botMessage: Message = {
      role: 'bot',
      content: response.response,
      timestamp: new Date().toISOString(),
      mood: response.mood
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    // Save bot message and mood
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(botMessage),
    });

    fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: response.mood }),
    }).then(() => fetchData());
  };

  const clearChat = async () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      await fetch('/api/chats', { method: 'DELETE' });
      setMessages([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-800"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
              <Heart size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MindfulMate</h1>
            <p className="text-slate-500 dark:text-slate-400">Your student mental health companion</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const chartData = moodHistory.map(entry => ({
    time: format(new Date(entry.timestamp), 'MMM d, HH:mm'),
    value: MOOD_VALUES[entry.mood] || 3,
    mood: entry.mood
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">MindfulMate</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, {user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            title={view === 'chat' ? 'Mood History' : 'Back to Chat'}
          >
            {view === 'chat' ? <History size={20} /> : <MessageCircle size={20} />}
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col overflow-hidden">
        {view === 'chat' ? (
          <>
            {/* Chat Window */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <Sparkles size={48} className="text-emerald-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">How are you feeling today?</h2>
                  <p className="max-w-xs text-sm">I'm here to listen, support, and help you navigate through student life stress.</p>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none"
                    )}>
                      <div className="prose dark:prose-invert max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </span>
                      {msg.mood && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {MOOD_EMOJIS[msg.mood]} {msg.mood}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-lg">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button 
                  type="button"
                  onClick={clearChat}
                  className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={20} />
                </button>
                <input 
                  type="text"
                  placeholder="Share what's on your mind..."
                  className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm md:text-base"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
            
            <p className="text-[10px] text-center mt-3 text-slate-400 flex items-center justify-center gap-1">
              <AlertCircle size={10} />
              This chatbot is for support only and is not a replacement for professional mental health care.
            </p>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mood Trends</h2>
              <div className="text-sm text-slate-500">Last {moodHistory.length} entries</div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    domain={[0, 6]} 
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => {
                      if (val === 5) return 'Happy';
                      if (val === 3) return 'Neutral';
                      if (val === 1) return 'Sad';
                      return '';
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMood)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wind size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Breathing</p>
                  <p className="font-semibold">4-7-8 Exercise</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Coffee size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Relaxation</p>
                  <p className="font-semibold">5m Meditation</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Motivation</p>
                  <p className="font-semibold">Daily Affirmations</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
