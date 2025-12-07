import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().toUpperCase() === 'GG') {
      onLogin();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl mb-6 ring-1 ring-slate-600/50">
            <ShieldCheck className="w-12 h-12 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            AdGuardian <span className="text-indigo-500">CN</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">
            广告合规智能监管系统
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                访问密令 (Access PIN)
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono tracking-widest text-lg placeholder:text-slate-600 focus:bg-slate-900"
                  placeholder="请输入系统密令"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm font-bold bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 animate-shake">
                <AlertCircle className="w-4 h-4" />
                <span>密令错误，访问被拒绝</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
            >
              <span>进入监管系统</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8 text-slate-600 text-xs font-mono">
          <p>SYSTEM ID: ADG-CN-2025-SECURE</p>
          <p className="mt-1">仅限授权监管人员使用 | Authorized Only</p>
        </div>
      </div>
    </div>
  );
};