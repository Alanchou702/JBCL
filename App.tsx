
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalysisForm } from './components/AnalysisForm';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryList } from './components/HistoryList';
import { CorrectionChat } from './components/CorrectionChat';
import { RegulationsPanel } from './components/RegulationsPanel';
import { ComplaineeLibrary } from './components/ComplaineeLibrary';
import { AnalysisState, InputMode, HistoryItem, ChatMessage, Complainee } from './types';
import { analyzeContent } from './services/geminiService';
import { AlertCircle, BookOpen, Fingerprint, SearchCheck, ShieldCheck, Activity, Briefcase, LayoutDashboard, History, MessageSquareText } from 'lucide-react';

const HISTORY_KEY = 'adguardian_v68_titanium_compact_v2';
const LIBRARY_KEY = 'adguardian_complainee_library_v1';
const MAX_HISTORY = 10;

const App: React.FC = () => {
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isLibOpen, setIsLibOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'history' | 'expert'>('audit');
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [complaineeLibrary, setComplaineeLibrary] = useState<Complainee[]>([]);
  const [lastInput, setLastInput] = useState<{images: string[], mode: InputMode, url?: string} | null>(null);

  useEffect(() => {
    try {
      const savedHist = localStorage.getItem(HISTORY_KEY);
      if (savedHist) setHistory(JSON.parse(savedHist));
      
      const savedLib = localStorage.getItem(LIBRARY_KEY);
      if (savedLib) setComplaineeLibrary(JSON.parse(savedLib));
    } catch (e) {
      console.error("LOAD_ERR", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(complaineeLibrary));
  }, [complaineeLibrary]);

  const saveHistory = (newItem: HistoryItem) => {
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addToLibrary = (name: string) => {
    const trimmedName = name.trim();
    if (complaineeLibrary.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`对象 “${trimmedName}” 已在库中，无需重复录入。`);
      return;
    }
    const newComplainee: Complainee = {
      id: Date.now().toString(),
      name: trimmedName,
      addedAt: Date.now()
    };
    setComplaineeLibrary(prev => [newComplainee, ...prev]);
    alert(`成功录入：“${trimmedName}” 已存入已投诉对象库。`);
  };

  const removeFromLibrary = (id: string) => {
    setComplaineeLibrary(prev => prev.filter(c => c.id !== id));
  };

  const handleAnalyze = async (_content: string, images: string[], mode: InputMode, url?: string, isReAudit: boolean = false) => {
    setState({ isLoading: true, error: null, result: null });
    if (!isReAudit) {
      setChatMessages([]);
      setLastInput({ images, mode, url });
    }
    
    try {
      const result = await analyzeContent("", images, mode, url);
      const isDuplicate = complaineeLibrary.some(c => 
        c.name.toLowerCase().includes(result.productName.toLowerCase()) || 
        result.productName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      const enrichedResult = { ...result, isDuplicate };
      setState({ isLoading: false, error: null, result: enrichedResult });
      setActiveTab('audit');

      if (result && !["分析引擎中断"].includes(result.productName)) {
          saveHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            productName: result.productName,
            summary: result.summary,
            result: enrichedResult
          });
      }
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || "审计服务暂不可用", result: null });
    }
  };

  const handleReAudit = () => {
    if (lastInput) {
      handleAnalyze("", lastInput.images, lastInput.mode, lastInput.url, true);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setChatMessages([]);
    setState({ isLoading: false, error: null, result: item.result });
    setLastInput(null);
    setActiveTab('audit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/40 font-sans overflow-x-hidden antialiased">
      {/* 动态背景背景 */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03),transparent_70%)] opacity-100"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 rounded-full blur-[160px]"></div>
      </div>

      <Header />

      <main className="container mx-auto px-6 max-w-[1440px] pt-8 pb-20 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* 左侧控制面板 - 重构为垂直导航风格 */}
          <div className="xl:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                     <Fingerprint className="w-4 h-4 text-indigo-400" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">终端控制单元</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-full border border-slate-800">
                   <Activity className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-bold text-slate-500 uppercase">Sys-Active</span>
                </div>
            </div>
            
            <AnalysisForm 
              onAnalyze={handleAnalyze} 
              isLoading={state.isLoading} 
              onModeChange={() => {
                setState(prev => ({ ...prev, result: null, error: null }));
                setChatMessages([]);
              }}
            />

            {/* 功能页签切换器 */}
            <div className="bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/60 flex gap-2">
              <button 
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> 实时审计
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <History className="w-3.5 h-3.5" /> 历史存证
              </button>
              <button 
                onClick={() => setActiveTab('expert')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'expert' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                <MessageSquareText className="w-3.5 h-3.5" /> 专家复核
              </button>
            </div>
          </div>

          {/* 右侧展示区 */}
          <div className="xl:col-span-8 space-y-6 min-w-0">
            {activeTab === 'audit' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {!state.isLoading && !state.result && !state.error && (
                  <div className="h-[600px] bg-slate-900/10 border border-slate-800/40 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center relative group overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05),transparent_70%)]"></div>
                     <div className="w-24 h-24 bg-slate-950 rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl mb-8 group-hover:scale-105 transition-all duration-700">
                        <SearchCheck className="w-12 h-12 text-indigo-500/30" />
                     </div>
                     <h3 className="text-2xl font-black text-white mb-3">等待法理审计指令</h3>
                     <p className="text-slate-500 max-w-sm text-xs font-medium leading-relaxed">
                       请在控制面板输入合规检查项。<br/>
                       Gemini 3.0 Pro 核心引擎将执行穿透式风险扫描与存证生成。
                     </p>
                  </div>
                )}

                {state.isLoading && (
                  <div className="h-[600px] bg-slate-900/30 border border-indigo-500/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                     <div className="absolute inset-x-0 h-px bg-indigo-500/30 shadow-[0_0_20px_#6366f1] top-0 animate-[scan_4s_linear_infinite] z-20"></div>
                     <div className="relative mb-10">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.4)] relative z-10 border border-white/20">
                           <ShieldCheck className="w-10 h-10 text-white animate-pulse" />
                        </div>
                     </div>
                     <h3 className="text-sm font-black text-white mb-6 tracking-[0.4em] uppercase opacity-90">多维语义逻辑巡航分析中</h3>
                     <div className="w-full max-w-[200px] bg-slate-950 h-1.5 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-full animate-[progress_3.5s_infinite] origin-left shadow-[0_0_10px_#6366f1]"></div>
                     </div>
                     <p className="mt-8 text-[10px] text-slate-600 font-mono uppercase tracking-widest animate-pulse">Deep Law Analysis v6.8.0-Pro</p>
                  </div>
                )}

                {state.error && (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[2rem] flex items-start gap-6 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 bg-rose-600/10 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-xl mb-2 text-white uppercase tracking-tight">审计核心链路受阻</h4>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed">{state.error}</p>
                      <button onClick={() => window.location.reload()} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-900/20">重新挂载审计核心</button>
                    </div>
                  </div>
                )}

                {state.result && (
                  <ResultDisplay 
                    result={state.result} 
                    onReAudit={handleReAudit} 
                    canReAudit={!!lastInput}
                    onAddToLibrary={addToLibrary}
                    isInLibrary={complaineeLibrary.some(c => 
                      c.name.toLowerCase().includes(state.result!.productName.toLowerCase()) ||
                      state.result!.productName.toLowerCase().includes(c.name.toLowerCase())
                    )}
                  />
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 px-2 flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <History className="w-6 h-6 text-indigo-500" />
                    存证归档系统
                  </h3>
                </div>
                <HistoryList 
                  history={history} 
                  onSelect={loadHistoryItem} 
                  onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))}
                  onClear={() => { if(window.confirm("确认清除全部归档记录？")) setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                />
              </div>
            )}

            {activeTab === 'expert' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 px-2">
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <MessageSquareText className="w-6 h-6 text-indigo-500" />
                    专家交互复核
                  </h3>
                </div>
                {state.result ? (
                  <CorrectionChat 
                    messages={chatMessages}
                    onUpdateMessages={setChatMessages}
                    analysisContext={state.result}
                  />
                ) : (
                  <div className="h-[400px] bg-slate-900/10 border border-slate-800/40 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
                    <MessageSquareText className="w-12 h-12 text-slate-800 mb-6" />
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">请先完成一次合规审计以开启复核对话</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 固定动作按钮区 */}
      <div className="fixed bottom-6 right-8 z-50 flex flex-col gap-4">
           <button 
             onClick={() => setIsLibOpen(true)}
             className="bg-rose-600 text-white p-4 rounded-2xl shadow-2xl hover:bg-rose-500 hover:scale-110 transition-all flex items-center gap-3 group border border-white/10 ring-8 ring-rose-500/5"
           >
              <Briefcase className="w-5 h-5" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-black text-[11px] uppercase tracking-widest">
                被投诉对象库
              </span>
           </button>
           <button 
             onClick={() => setIsRegOpen(true)}
             className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl hover:bg-indigo-500 hover:scale-110 transition-all flex items-center gap-3 group border border-white/10 ring-8 ring-indigo-500/5"
           >
              <BookOpen className="w-5 h-5" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-black text-[11px] uppercase tracking-widest">
                法规基准库
              </span>
           </button>
      </div>

      {/* 全屏抽屉面板 */}
      {isRegOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsRegOpen(false)}></div>
          <div className="relative w-full max-w-2xl h-full bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-slate-800 animate-in slide-in-from-right duration-500 ease-out">
             <RegulationsPanel onClose={() => setIsRegOpen(false)} />
          </div>
        </div>
      )}

      {isLibOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsLibOpen(false)}></div>
          <div className="relative w-full max-w-md h-full bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-slate-800 animate-in slide-in-from-right duration-500 ease-out">
             <ComplaineeLibrary 
                library={complaineeLibrary} 
                onAdd={addToLibrary} 
                onRemove={removeFromLibrary} 
                onClose={() => setIsLibOpen(false)} 
             />
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); opacity: 0.5; }
          40% { transform: scaleX(0.7); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
