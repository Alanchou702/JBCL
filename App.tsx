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
  
  // State to pre-fill URL from Discovery
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');

  // Load history from localStorage on mount
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

  // Save history helper
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

      // Save to history if successful
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      
      <main className="container mx-auto px-4 max-w-4xl mt-8">
        
        {/* Main Tab Navigation */}
        <div className="flex justify-center mb-8">
           <div className="bg-white p-1 rounded-full shadow-sm border border-slate-200 flex">
              <button 
                onClick={() => setActiveTab('ANALYSIS')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'ANALYSIS' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                合规校验
              </button>
              <button 
                onClick={() => setActiveTab('DISCOVERY')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'DISCOVERY' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-4 h-4" />
                风险巡查
              </button>
           </div>
        </div>

        {activeTab === 'ANALYSIS' && (
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-3">
                    一键检测广告合规风险
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    基于最新《广告法》、《中医药法》等法规，利用AI智能识别虚假宣传、违规承诺及绝对化用语，支持<b>图片/截图</b>识别，自动生成专业合规报告。
                </p>
            </div>

            <AnalysisForm 
              key={prefilledUrl} 
              onAnalyze={handleAnalyze} 
              isLoading={state.isLoading} 
              initialUrl={prefilledUrl}
            />
            
            {state.error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                    <p>{state.error}</p>
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
        <div className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
            <p>
                免责声明：本工具基于人工智能技术提供辅助性合规建议，仅供参考，不作为最终法律依据。
                <br />
                重大商业决策请咨询专业法务人员或相关监管部门。
            </p>
        </div>
      </main>
    </div>
  );
};

export default App;