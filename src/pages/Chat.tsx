import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { MessageSquare, Send, Users, Bot, Mic, MicOff, Loader2 } from 'lucide-react';
import { useLiveAgent } from '../hooks/useLiveAgent';

type Message = {
  id: string;
  senderId: string;
  senderEmail: string;
  text: string;
  createdAt: number;
};

export function Chat() {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, isConnecting, connect, disconnect, agentResponse } = useLiveAgent();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'messages'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs.reverse());
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentResponse]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        ownerId: auth.currentUser?.uid || '',
        senderId: user.uid,
        senderEmail: user.email,
        text: newMessage.trim(),
        createdAt: Date.now()
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#2A2A2A] pb-4 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#E5E5E5]">Live Support & Chat</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">Talk to AI or text other garage staff</p>
        </div>
        <div className="flex items-center w-full sm:w-auto">
            <button
                onClick={isConnected ? disconnect : connect}
                className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isConnected ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 
                  isConnecting ? 'bg-[#D4AF37]/50 text-black cursor-not-allowed' : 
                  'bg-[#D4AF37] text-black hover:bg-opacity-90'
                }`}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 isConnected ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isConnecting ? 'Connecting...' : isConnected ? 'End Voice Assist' : 'Start Voice Assist'}
              </button>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl flex-1 flex flex-col min-h-0">
        <div className="border-b border-[#2A2A2A] p-4 shrink-0 font-bold text-[#E5E5E5] flex items-center gap-2">
          {isConnected ? <Bot className="text-[#D4AF37] w-5 h-5 animate-pulse" /> : <Users className="text-[#D4AF37] w-5 h-5" />}
          {isConnected ? 'Live AI Assistant Active' : 'Garage General Channel'}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-[#A3A3A3] mb-1 px-1">
                  {isMe ? 'You' : msg.senderEmail.split('@')[0]} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm ${
                  isMe ? 'bg-[#D4AF37]/20 text-[#E5E5E5] border border-[#D4AF37]/20' : 'bg-[#0A0A0A] text-[#E5E5E5] border border-[#2A2A2A]'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {isConnected && (
              <div className="flex flex-col items-start mt-4">
                <span className="text-[10px] text-[#A3A3A3] mb-1 px-1 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> GarageAssist AI
                </span>
                <div className="max-w-[85%] px-4 py-3 rounded-lg text-sm bg-[#D4AF37]/10 text-[#E5E5E5] border border-[#D4AF37]/20 italic">
                  {agentResponse || "Listening..."}
                </div>
              </div>
          )}
          
          {messages.length === 0 && !isConnected && (
            <div className="h-full flex flex-col items-center justify-center text-[#A3A3A3] opacity-50 pb-20">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>No messages yet. Send a message to the team or start Voice Assist.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSend} className="flex gap-2 shrink-0 p-4 border-t border-[#2A2A2A] bg-[#0A0A0A] rounded-b-xl">
          <input 
            placeholder="Type a message to the garage..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 bg-[#161616] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white outline-none focus:border-[#D4AF37]"
          />
          <button type="submit" disabled={!newMessage.trim()} className="w-12 flex justify-center items-center bg-[#D4AF37] text-black rounded-lg disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
