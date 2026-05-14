import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { askAI } from '../lib/geminiAgent';
import ReactMarkdown from 'react-markdown';

type ChatMessage = {
  role: 'user' | 'ai';
  text: string;
};

export function AskAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hello! I'm your GarageAssist AI. Ask me any automotive questions, request torque specs, or discuss diagnostic strategies." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await askAI(userText);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'No response.' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `*Error:* ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5] flex items-center gap-3">
          <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
          Ask AI
        </h1>
      </div>

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#2A2A2A]' : 'bg-[#D4AF37]/20 border border-[#D4AF37]/50'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-[#E5E5E5]" /> : <Bot className="w-4 h-4 text-[#D4AF37]" />}
              </div>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-[#0A0A0A] border border-[#2A2A2A] text-[#E5E5E5]' : 'bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#A3A3A3] prose prose-invert prose-sm max-w-none'}`}>
                 {msg.role === 'user' ? (
                   msg.text
                 ) : (
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#D4AF37]/20 border border-[#D4AF37]/50">
                <Bot className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center">
                 <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-[#2A2A2A] bg-[#0A0A0A] rounded-b-xl flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-[#161616] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white outline-none focus:border-[#D4AF37] disabled:opacity-50"
            placeholder="Ask about a repair procedure, spec, or code..."
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-12 flex justify-center items-center bg-[#D4AF37] text-black rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
