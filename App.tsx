import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryList } from './components/HistoryList';
import { DiscoveryPanel } from './components/DiscoveryPanel';
import { AnalysisState, InputMode, HistoryItem } from './types';
import { analyzeContent } from './services/geminiService';
import { AlertCircle, Search, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 max-w-5xl mt-8">
        
        {/* Main Tab Navigation */}
        <div className="flex justify-center mb-10">
           <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex">
              <button 
                onClick={() => setActiveTab('ANALYSIS')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'ANALYSIS' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                合规校验
              </button>
              <button 
                onClick={() => setActiveTab('DISCOVERY')}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'DISCOVERY' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                风险巡查
              </button>
           </div>
        </div>

        {activeTab === 'ANALYSIS' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                    智能广告合规校验系统
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    依据最新监管法规，AI深度识别广告风险，一键生成专业举报文案。
                </p>
            </div>

            <AnalysisForm 
              key={prefilledUrl} 
              onAnalyze={handleAnalyze} 
              isLoading={state.isLoading} 
              initialUrl={prefilledUrl}
            />
            
            {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl flex items-start gap-4 shadow-sm animate-pulse">
                    <AlertCircle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold">分析中断</h4>
                      <p className="text-sm mt-1 opacity-90">{state.error}</p>
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

        {/* Footer Disclaimer */}
        <div className="mt-20 border-t border-slate-200 pt-8 text-center text-xs text-slate-400 leading-relaxed">
            <p className="max-w-xl mx-auto">
                <span className="font-bold text-slate-500">免责声明：</span> 
                本工具提供的合规建议基于人工智能模型生成，仅供参考，不具有法律效力。
                在做出重大商业决策或法律行动前，请务必咨询专业律师或相关监管部门。
                系统不会保存您的敏感商业数据。
            </p>
            <p className="mt-2 text-slate-300">© 2025 AdGuardian CN. All Rights Reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default App;
