
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult } from '../types';
import { Send, User, Bot, Sparkles, Loader2, Hash, CheckCircle, AlertCircle } from 'lucide-react';
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
        text: "通信中断，请重试。",
        timestamp: Date.now()
      };
      onUpdateMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[500px] ring-1 ring-white/5 shadow-2xl">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-black text-white text-xs">AI 专家在线复核系统</h3>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Expert Re-Audit & Revision Console</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[8px] text-indigo-400 font-black uppercase">
          <Sparkles className="w-3 h-3" />
          Auto-Sync Active
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
         {messages.length === 0 && (
             <div className="text-center py-16 px-6 opacity-50">
                 <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">在此发起法理复核或文案改写</p>
                 <p className="text-[8px] text-slate-600 font-medium leading-relaxed">
                   补充证据、指出误报或要求针对新违规点生成存证文案。<br/>
                   系统将自动按 350-380 字标准重新组织公文。
                 </p>
             </div>
         )}
         
         {messages.map((msg, idx) => {
             const isOfficialForm = msg.text.includes("该企业在") && msg.text.includes("投诉请求 (必须完整保留)：");
             const msgWordCount = msg.text.length;
             const isValidCount = msgWordCount >= 350 && msgWordCount <= 380;

             return (
               <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[90%] rounded-xl px-4 py-3 text-xs leading-relaxed relative group/msg ${
                       msg.role === 'user' 
                       ? 'bg-indigo-600 text-white rounded-br-none' 
                       : 'bg-slate-950 border border-slate-800 text-slate-300 rounded-bl-none'
                   }`}>
                       <div className="whitespace-pre-wrap antialiased">
                         {msg.text}
                       </div>
                       
                       {msg.role === 'model' && isOfficialForm && (
                         <div className={`mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-tight ${isValidCount ? 'text-emerald-500' : 'text-amber-500'}`}>
                           <div className="flex items-center gap-1">
                             <Hash className="w-2.5 h-2.5" />
                             <span>复核存证字数: {msgWordCount} / 350-380</span>
                           </div>
                           {isValidCount ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5 animate-pulse" />}
                         </div>
                       )}
                   </div>
               </div>
             );
         })}
         
         {isLoading && (
             <div className="flex gap-3 justify-start">
                 <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl rounded-bl-none flex items-center gap-3">
                     <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                     <span className="text-[10px] text-slate-500 font-black tracking-widest">RE-AUDITING CASE...</span>
                 </div>
             </div>
         )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-950/80 border-t border-slate-800">
          <div className="relative group">
              <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="提供新证据或指令（如：补充洋品牌误导点）..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-1 focus:ring-indigo-600 transition-all text-xs text-white placeholder:text-slate-600"
                  disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-30 transition-all shadow-lg active:scale-95"
              >
                  <Send className="w-4 h-4" />
              </button>
          </div>
      </form>
    </div>
  );
};
