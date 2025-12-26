
import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`);
  }, []);

  return (
    <header className="bg-slate-950/40 backdrop-blur-2xl border-b border-slate-800/60 sticky top-0 z-[100] ring-1 ring-white/5 shadow-xl">
      <div className="container mx-auto px-8 h-24 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-110 transition-all duration-500 border border-white/10 group cursor-default">
            <Scale className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black text-white tracking-tighter">
                ADGUARDIAN <span className="text-indigo-500">TITANIUM</span>
              </h1>
              <span className="px-3 py-1 bg-white/5 text-[9px] font-black text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">v6.8 Enterprise</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.6em] mt-1.5 opacity-80">
              多维法理审计与合规存证终端
            </p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-12">
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">算力集群状态</span>
             <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
               <Cpu className="w-4 h-4 text-indigo-400" />
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
               <span className="text-[11px] text-slate-300 font-black tracking-tight">GEMINI 3.0 PRO READY</span>
             </div>
           </div>
           
           <div className="h-12 w-px bg-slate-800/60"></div>
           
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">系统同步周期</span>
             <div className="flex items-center gap-3">
                <span className="text-white font-mono font-bold text-lg tracking-widest">{currentDate}</span>
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
             </div>
           </div>
        </div>
      </div>
    </header>
  );
};
