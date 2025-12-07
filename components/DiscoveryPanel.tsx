import React, { useState } from 'react';
import { DiscoveryItem } from '../types';
import { discoverRisks } from '../services/geminiService';
import { Search, ExternalLink, ShieldAlert, Loader2, ArrowRight, RefreshCw, Stethoscope, Utensils, Zap, Sparkles, AlertTriangle, ScanEye } from 'lucide-react';

interface DiscoveryPanelProps {
  onAnalyzeItem: (url: string) => void;
}

const CATEGORIES = [
  { id: 'MEDICAL', name: '医药/医疗', icon: Stethoscope, color: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100' },
  { id: 'BEAUTY', name: '医美/美妆', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { id: 'FOOD', name: '食品/保健', icon: Utensils, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { id: 'GENERAL', name: '通用/金融', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
];

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ onAnalyzeItem }) => {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('MEDICAL');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (category: string) => {
    setIsLoading(true);
    setCurrentCategory(category);
    setHasSearched(true);
    setItems([]); 

    try {
      const results = await discoverRisks(category);
      setItems(results);
    } catch (error) {
      console.error("Discovery failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoPatrol = async () => {
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    handleSearch(randomCat.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
      {/* Dashboard Header */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                 <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                    <ScanEye className="w-6 h-6 text-white" />
                 </div>
                 全网风险巡查雷达
               </h3>
               <p className="text-slate-500 mt-2 font-medium">
                 实时扫描微信公众平台、小程序及全网潜在违规广告线索
               </p>
            </div>
            
            <button
              onClick={handleAutoPatrol}
              disabled={isLoading}
              className={`px-8 py-4 rounded-xl flex items-center gap-3 transition-all font-bold text-sm shadow-md hover:shadow-xl hover:-translate-y-1 ${
                isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              {isLoading ? "雷达扫描中..." : "启动智能巡查"}
            </button>
         </div>

         {/* Category Filters */}
         <div className="flex flex-wrap gap-3 mt-8">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                    isActive 
                      ? `${cat.color} ring-2 ring-offset-2 ring-indigo-100 scale-105 shadow-sm` 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              )
            })}
         </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 bg-slate-50 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75 duration-1000"></div>
              <div className="relative bg-white p-6 rounded-full shadow-xl border border-indigo-100">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              </div>
            </div>
            <p className="font-bold text-slate-800 text-lg">正在全网扫描风险线索...</p>
            <p className="text-sm text-slate-500 mt-2">目标区域: {CATEGORIES.find(c=>c.id === currentCategory)?.name} | 来源: 微信公众平台</p>
          </div>
        )}

        {!isLoading && hasSearched && items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6 shadow-inner">
               <RefreshCw className="w-12 h-12 text-slate-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-700">暂未发现高风险线索</h4>
            <p className="text-slate-500 mt-3 mb-8 max-w-md">
              当前关键词在近期内未检索到明显的严重违规内容，这可能意味着该领域近期较为合规，或搜索引擎尚未收录最新数据。
            </p>
            <button 
              onClick={() => handleSearch(currentCategory)}
              className="px-6 py-2.5 bg-white border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> 深度重新扫描
            </button>
          </div>
        )}
        
        {!isLoading && !hasSearched && (
           <div className="h-full flex flex-col items-center justify-center py-24 text-center px-4">
             <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 rotate-12 transform hover:rotate-0 transition-transform duration-500">
                <ShieldAlert className="w-20 h-20 text-indigo-500" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-3">系统准备就绪</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
               点击上方 <span className="text-indigo-600 font-bold">“启动智能巡查”</span>，AI将自动检索并识别潜在的违法广告线索。
             </p>
           </div>
        )}

        {items.length > 0 && !isLoading && (
          <div className="p-6 space-y-4">
             <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>已锁定 {items.length} 条疑似违规线索</span>
                </div>
                <button 
                  onClick={() => handleSearch(currentCategory)} 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 换一批
                </button>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => (
                  <div key={index} className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase">
                          {item.source}
                        </span>
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors text-base">
                          {item.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-mono bg-slate-50 inline-block px-2 py-1 rounded max-w-full">
                         <ExternalLink className="w-3 h-3 shrink-0" />
                         <span className="truncate">{item.url}</span>
                      </div>

                      <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        潜在风险: {item.snippet || "包含夸大或绝对化用语，建议进一步人工核查。"}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => onAnalyzeItem(item.url)}
                      className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:scale-105 transition-all shadow-lg shadow-slate-900/20"
                    >
                      立即校验
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};