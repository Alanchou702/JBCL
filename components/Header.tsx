import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    // Format: YYYY.MM.DD
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    setCurrentDate(formatted);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-indigo-500/30 sticky top-0 z-50 shadow-xl shadow-indigo-900/20">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 opacity-90"></div>
      <div className="container mx-auto px-4 h-18 md:h-20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-2xl">
              <Scale className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-sans">
              AdGuardian <span className="text-indigo-400">CN</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.2em] font-medium">
                广告合规智能监管系统
              </p>
              <span className="hidden md:inline-block px-1.5 py-0.5 bg-indigo-900/50 border border-indigo-500/30 rounded text-[9px] text-indigo-300">
                PRO
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm">
             <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </div>
             <span className="text-xs text-slate-300 font-medium">系统运行正常</span>
           </div>
           
           <div className="h-8 w-px bg-slate-700/50"></div>
           
           <div className="flex flex-col items-end">
             <span className="text-xs text-slate-400 flex items-center gap-1">
               <ShieldCheck className="w-3 h-3 text-indigo-400" /> 
               法规库版本: <span className="text-emerald-400 font-mono font-bold">{currentDate || 'Loading...'} (自动更新)</span>
             </span>
           </div>
        </div>
      </div>
    </header>
  );
};