import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryList } from './components/HistoryList';
import { DiscoveryPanel } from './components/DiscoveryPanel';
import { AnalysisState, InputMode, HistoryItem } from './types';
import { analyzeContent } from './services/geminiService';
import { AlertCircle, Search, ShieldCheck, Radar } from 'lucide-react';

const HISTORY_KEY = 'adguardian_history_v1';
const MAX_HISTORY = 20;

type AppTab = 'ANALYSIS' | 'DISCOVERY';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('ANALYSIS');
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveHistory = (newItem: HistoryItem) => {
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    if (window.confirm("确定要清空所有历史记录吗？")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleAnalyze = async (content: string, images: string[], mode: InputMode, url?: string) => {
    setState({ isLoading: true, error: null, result: null });
    try {
      const result = await analyzeContent(content, images, mode, url);
      setState({ isLoading: false, error: null, result });

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        productName: result.productName,
        summary: result.summary,
        result: result
      };
      saveHistory(historyItem);

    } catch (err: any) {
      setState({ 
        isLoading: false, 
        error: err.message || '发生未知错误，请检查网络设置或API配置。', 
        result: null 
      });
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTab('ANALYSIS');
    setState({
      isLoading: false,
      error: null,
      result: item.result
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyzeDiscoveryItem = (url: string) => {
    setPrefilledUrl(url);
    setActiveTab('ANALYSIS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      
      <Header />
      
      <main className="container mx-auto px-4 max-w-6xl mt-8 pb-20 relative z-10">
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
           <div className="bg-slate-900 p-1.5 rounded-2xl shadow-xl shadow-slate-300/50 flex relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-800/50"></div>
              <button 
                onClick={() => setActiveTab('ANALYSIS')}
                className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'ANALYSIS' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-y-[-1px]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                合规校验台
              </button>
              <button 
                onClick={() => setActiveTab('DISCOVERY')}
                className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'DISCOVERY' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-y-[-1px]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Radar className="w-4 h-4" />
                全网巡查雷达
              </button>
           </div>
        </div>

        {activeTab === 'ANALYSIS' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center space-y-3 mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                    智能广告合规校验
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                    基于 Google Gemini 多模态模型，精准识别图文违规风险
                </p>
            </div>

            <AnalysisForm 
              key={prefilledUrl} 
              onAnalyze={handleAnalyze} 
              isLoading={state.isLoading} 
              initialUrl={prefilledUrl}
            />
            
            {state.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse">
                    <div className="bg-rose-100 p-2 rounded-full">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">分析中断</h4>
                      <p className="text-sm mt-1 leading-relaxed opacity-90">{state.error}</p>
                    </div>
                </div>
            )}

            {state.result && (
                <ResultDisplay result={state.result} />
            )}

            <HistoryList 
              history={history} 
              onSelect={loadHistoryItem} 
              onClear={clearHistory}
            />
          </div>
        )}

        {activeTab === 'DISCOVERY' && (
          <div className="animate-fade-in">
             <DiscoveryPanel onAnalyzeItem={handleAnalyzeDiscoveryItem} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-24 border-t border-slate-200 pt-8 text-center">
            <p className="text-xs text-slate-400 mb-2 font-medium tracking-wide">
                AdGuardian CN &copy; 2025
            </p>
            <p className="text-[10px] text-slate-300 max-w-lg mx-auto leading-relaxed">
                本工具生成结果仅供参考，不作为法律依据。请以监管部门最终认定为准。
            </p>
        </div>
      </main>
    </div>
  );
};

export default App;