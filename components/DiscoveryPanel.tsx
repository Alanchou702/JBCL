import React, { useState } from 'react';
import { DiscoveryItem } from '../types';
import { discoverRisks } from '../services/geminiService';
import { Search, ExternalLink, ShieldAlert, Loader2, ArrowRight, RefreshCw, Stethoscope, Utensils, Zap, Sparkles, AlertTriangle } from 'lucide-react';

interface DiscoveryPanelProps {
  onAnalyzeItem: (url: string) => void;
}

const CATEGORIES = [
  { id: 'MEDICAL', name: '医药/医疗', icon: Stethoscope, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { id: 'BEAUTY', name: '医美/美妆', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { id: 'FOOD', name: '食品/保健', icon: Utensils, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'GENERAL', name: '通用/金融', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-100' },
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
      alert("搜索服务暂时繁忙，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoPatrol = async () => {
    // Pick a random category to simulate "Patrol"
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    handleSearch(randomCat.id);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <ShieldAlert className="w-6 h-6 text-indigo-600" />
                 风险广告自动巡查系统
               </h3>
               <p className="text-sm text-slate-500 mt-2">
                 智能检索全网（微信公众号/小程序）近6个月内的疑似违规内容。
               </p>
            </div>
            
            <button
              onClick={handleAutoPatrol}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow-md ${
                isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isLoading ? "系统正在巡查..." : "开始全网巡查"}
            </button>
         </div>

         {/* Category Filters */}
         <div className="flex flex-wrap gap-3 mt-6">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive 
                      ? `${cat.color} ring-1 ring-offset-1 ring-offset-white ${cat.color.replace('text-', 'ring-')}` 
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
      <div className="flex-1 bg-slate-50/30">
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-sm border border-indigo-100">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700 text-lg">AI 正在深度扫描 {CATEGORIES.find(c=>c.id === currentCategory)?.name} 领域</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">正在分析微信公众号文章标题、摘要及关键词匹配度...</p>
            </div>
          </div>
        )}

        {!isLoading && hasSearched && items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
               <RefreshCw className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-lg font-medium text-slate-700">暂未发现高风险线索</h4>
            <p className="text-sm mt-2 mb-6">当前分类下未检索到近期明显的违规广告内容。</p>
            <button 
              onClick={() => handleSearch(currentCategory)}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> 尝试重新搜索
            </button>
          </div>
        )}
        
        {!isLoading && !hasSearched && (
           <div className="h-full flex flex-col items-center justify-center py-24 text-center px-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 rotate-3 transform hover:rotate-0 transition-transform duration-500">
                <ShieldAlert className="w-16 h-16 text-indigo-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">准备就绪</h3>
             <p className="text-slate-500 max-w-md mx-auto mb-8">
               点击“开始全网巡查”或选择特定分类，系统将自动检索并识别潜在的违法广告线索。
             </p>
           </div>
        )}

        {items.length > 0 && !isLoading && (
          <div className="p-4 space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100">
                  <AlertTriangle className="w-4 h-4" />
                  <span>已发现 {items.length} 条疑似违规线索（仅供参考）</span>
                </div>
                <button 
                  onClick={() => handleSearch(currentCategory)} 
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> 换一批
                </button>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {items.map((item, index) => (
                  <div key={index} className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">
                          {item.source}
                        </span>
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors text-sm md:text-base">
                          {item.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-2 font-mono">
                         <ExternalLink className="w-3 h-3" />
                         <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-indigo-500 truncate max-w-[300px]">
                           {item.url}
                         </a>
                      </div>

                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-1">
                        <span className="text-rose-500 font-medium mr-1">● 潜在风险:</span>
                        {item.snippet || "包含夸大或绝对化用语，建议进一步人工核查。"}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => onAnalyzeItem(item.url)}
                      className="shrink-0 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all"
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
