import React from 'react';
import { Scale, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white border-b border-indigo-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-900/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-white">AdGuardian CN</h1>
            <p className="text-indigo-300 text-[10px] tracking-wider uppercase font-medium">广告合规智能监管系统</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
             <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
             <span>已加载最新《广告法》数据库</span>
           </div>
           <div className="h-4 w-px bg-slate-700"></div>
           <span className="text-xs text-slate-500 font-mono">v2.1.0</span>
        </div>
      </div>
    </header>
  );
};
