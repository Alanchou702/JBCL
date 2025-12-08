
import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, Settings, Globe } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (apiKey: string, baseUrl: string, modelId: string) => void;
}

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [modelId, setModelId] = useState(DEFAULT_MODEL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().toUpperCase() === 'GG') {
      if (apiKey.trim().length > 10) {
        onLogin(apiKey.trim(), baseUrl.trim(), modelId);
      } else {
        alert("请输入有效的 Google Gemini API Key");
      }
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl mb-5 ring-1 ring-slate-600/50">
            <ShieldCheck className="w-12 h-12 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            AdGuardian <span className="text-indigo-500">CN</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">
            Google Gemini 专用版
          </p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* PIN Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                访问密令 (Access PIN)
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(false); }}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono tracking-widest text-lg placeholder:text-slate-700 focus:bg-slate-900"
                  placeholder="GG"
                  autoFocus
                />
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Google Gemini API Key
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm placeholder:text-slate-700 focus:bg-slate-900"
                  placeholder="AIzaSy..."
                />
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-2 border-t border-slate-700/50">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors"
                >
                    <Settings className="w-3 h-3" />
                    {showAdvanced ? "收起高级配置" : "高级配置 (模型/代理)"}
                </button>
                
                {showAdvanced && (
                    <div className="mt-3 space-y-3 animate-fade-in bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                API Base URL (可选代理)
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 text-slate-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                                placeholder="https://generativelanguage.googleapis.com"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                模型版本
                            </label>
                            <input
                                type="text"
                                value={modelId}
                                onChange={(e) => setModelId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 text-slate-300 rounded-lg py-2 px-3 focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                            />
                        </div>
                    </div>
                )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm font-medium bg-rose-500/10 p-3 rounded-xl animate-shake border border-rose-500/20">
                <AlertCircle className="w-4 h-4" />
                <span>访问密令错误</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
            >
              <span>启动 Google 引擎</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-[10px] font-mono text-slate-500 border border-slate-700">
                <Globe className="w-3 h-3" />
                SYSTEM: V4.1-GOOGLE-ONLY
            </span>
        </div>
      </div>
    </div>
  );
};
