import React, { useState, useRef, useEffect } from 'react';
import { generateMentorResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const MentorBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hi! I’m your Antigravity Mentor. Need a hint or a quick explanation?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await generateMentorResponse(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I didn't catch that.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-speech not supported.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bot Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 border border-white/20 backdrop-blur-sm ${!isOpen ? 'animate-float' : ''}`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'}`}></i>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col transition-all animate-float-subtle" style={{ height: '500px' }}>
          <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10 backdrop-blur-sm">
            <h3 className="font-bold text-white flex items-center gap-2">
              <i className="fas fa-sparkles text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"></i> Mentor Bot
            </h3>
            <span className="text-xs text-gray-300">Powered by Gemini</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] group relative`}>
                    <div className={`p-3 text-sm rounded-2xl backdrop-blur-md border border-white/10 shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-neon-blue/40 text-white rounded-tr-none border-neon-blue/30' 
                        : 'bg-white/10 text-gray-100 rounded-tl-none'
                    }`}>
                        <div className="mb-1">{msg.text}</div>
                        {msg.role === 'model' && (
                            <div className="flex justify-end mt-2 pt-2 border-t border-white/10">
                                <button 
                                    onClick={() => speak(msg.text)}
                                    className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10"
                                    title="Read aloud"
                                >
                                    <i className="fas fa-volume-up text-neon-cyan"></i> Listen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 flex gap-1 backdrop-blur-sm border border-white/5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white/5 border-t border-white/10 backdrop-blur-md">
            <div className="flex gap-2 items-center">
              <button 
                onClick={startListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border border-white/10 ${
                    isListening ? 'bg-red-500/20 text-red-500 animate-pulse border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Voice Input"
              >
                <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask or speak..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-purple/50 focus:bg-black/40 transition-all placeholder-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="w-10 h-10 rounded-xl bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple flex items-center justify-center transition-colors border border-neon-purple/30 backdrop-blur-sm"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};