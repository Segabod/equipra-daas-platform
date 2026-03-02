import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Minimize2, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

export default function ChatInterface({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! 👋 I\'m your EquipraAfrica support assistant. I can help you with device requests, insurance claims, tickets, and more. What can I help you with today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful support assistant for EquipraAfrica, a Device-as-a-Service (DaaS) platform. Help users with:
- Device management and assignment
- Insurance claims filing and tracking
- Service ticket creation and resolution
- Device requests and procurement
- General platform navigation and features

Be friendly, concise, and professional. If the user asks something outside the scope of device management/DaaS, politely redirect them to the platform.

User question: ${input}`,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again or contact support at hello@equipraafrica.ng' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 rounded-2xl shadow-2xl overflow-hidden z-50" style={{ backgroundColor: 'white', borderColor: P.border, border: `1px solid ${P.border}` }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white" style={{ backgroundColor: P.navy }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <div>
            <div className="font-semibold text-sm">Support Assistant</div>
            <div className="text-xs opacity-75">Always here to help</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-opacity-20 hover:bg-white rounded">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-opacity-20 hover:bg-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: P.bg }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs px-4 py-2.5 rounded-lg text-sm leading-relaxed"
                  style={{
                    backgroundColor: msg.role === 'user' ? P.navy : 'white',
                    color: msg.role === 'user' ? 'white' : P.text,
                    border: msg.role === 'user' ? 'none' : `1px solid ${P.border}`
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'white', border: `1px solid ${P.border}` }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: P.teal }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: P.border }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none disabled:opacity-50"
                style={{ borderColor: P.border }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: P.teal }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}