
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult } from '../types';
import { Send, User, Bot, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { sendExpertMessage } from '../services/geminiService';

interface CorrectionChatProps {
  messages: ChatMessage[];
  onUpdateMessages: (msgs: ChatMessage[]) => void;
  analysisContext: AnalysisResult;
}

export const CorrectionChat: React.FC<CorrectionChatProps> = ({ messages, onUpdateMessages, analysisContext }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    onUpdateMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendExpertMessage(newHistory, input, analysisContext);
      
      const botMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      onUpdateMessages([...newHistory, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        role: 'model',
        text: "对话连接中断，请稍后再试。",
        timestamp: Date.now()
      };
      onUpdateMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8 flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Bot className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
           <h3 className="font-bold text-slate-800">专家在线复核</h3>
           <p className="text-xs text-slate-500">发现误判或有疑问？在此向AI专家咨询或提供更多证据。</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
         {messages.length === 0 && (
             <div className="text-center py-12 px-6">
                 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                 </div>
                 <p className="text-sm text-slate-500 mb-2">您可以这样问：</p>
                 <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => setInput("这个商品不是药，是保健食品，请重新判断")} className="text-xs bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-full text-slate-600 transition-colors">这个不是药，是保健品</button>
                    <button onClick={() => setInput("根据哪一条法规判定的？")} className="text-xs bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-full text-slate-600 transition-colors">具体哪条法规？</button>
                    <button onClick={() => setInput("帮我修改一下文案，规避风险")} className="text-xs bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-full text-slate-600 transition-colors">帮我改写文案</button>
                 </div>
             </div>
         )}
         
         {messages.map((msg, idx) => (
             <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'model' && (
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                         <Bot className="w-4 h-4 text-indigo-600" />
                     </div>
                 )}
                 <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                     msg.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-br-none' 
                     : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm whitespace-pre-wrap'
                 }`}>
                     {msg.text}
                 </div>
                 {msg.role === 'user' && (
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                         <User className="w-4 h-4 text-slate-500" />
                     </div>
                 )}
             </div>
         ))}
         
         {isLoading && (
             <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                     <Bot className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                     <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                     <span className="text-xs text-slate-400">正在思考中...</span>
                 </div>
             </div>
         )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
          <div className="relative">
              <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入您的疑问或补充证据..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <Send className="w-4 h-4" />
              </button>
          </div>
      </form>
    </div>
  );
};