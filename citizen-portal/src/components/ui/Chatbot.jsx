import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import api from '../../services/api';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Civic Assistant. Ask me anything about active complaints, municipal statistics, or nearby leaks!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputText('');
    setLoading(true);

    try {
      const data = await api.post('/chatbot', { message: userMessage });
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I failed connecting to the server. Please check again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 select-none">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-emerald-500"
          title="Open AI Civic Helper"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Slide-out Chat Console Drawer */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-80 sm:w-85 shadow-2xl flex flex-col overflow-hidden h-[420px] transition-all animate-fade-in relative">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide">
              <Bot className="w-4.5 h-4.5 text-emerald-400" />
              <span>CIVIC BOT ASSISTANT</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none text-[11px] leading-relaxed">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                  m.sender === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-650'
                }`}>
                  {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-emerald-500" />}
                </div>

                <div className={`p-3.5 rounded-xl whitespace-pre-line ${
                  m.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-none font-bold' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800 font-semibold'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2 max-w-[80%]">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border text-slate-400 font-bold animate-pulse">
                  Analyzing database...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 dark:border-slate-850 flex gap-2">
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. show water leakage nearby..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 dark:text-white placeholder-slate-450"
            />
            <button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-[0.97]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
