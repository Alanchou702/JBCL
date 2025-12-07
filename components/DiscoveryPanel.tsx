import React, { useState } from 'react';
import { DiscoveryItem } from '../types';
import { discoverRisks } from '../services/geminiService';
import { Search, ExternalLink, ShieldAlert, Loader2, ArrowRight, RefreshCw, Pill, Stethoscope, Utensils, Zap } from 'lucide-react';

interface DiscoveryPanelProps {
  onAnalyzeItem: (url: string) => void;
}

const CATEGORIES = [
  { id: 'MEDICAL', name: '医药/医疗', icon: Stethoscope, color: 'text-red-600 bg-red-50' },
  { id: 'BEAUTY', name: '医美/美妆', icon: SparklesIcon, color: 'text-pink-600 bg-pink-50' },
  { id: 'FOOD', name: '食品/保健', icon: Utensils, color: 'text-green-600 bg-green-50' },
  { id: 'GENERAL', name: '通用/金融', icon: Zap, color: 'text-blue-600 bg-blue-50' },
];

// Helper for icon since Lucide imports might vary
function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ onAnalyzeItem }) => {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('MEDICAL');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (category: string) => {
    setIsLoading(true);
    setCurrentCategory(category);
    setHasSearched(true);
    
    // Clear previous if switching category manually, otherwise keep for "load more" effect?
    // Let's replace for now to keep it clean, user can always analyze and go back.
    setItems([]); 

    try {
      const results = await discoverRisks(category);
      setItems(results);
    } catch (error) {
      console.error("Discovery failed", error);
      alert("搜索失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoPatrol = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setItems([]);
    
    // Cycle through categories or pick random ones to fill list
    // To be efficient, we'll pick a random category
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setCurrentCategory(randomCat.id);
    
    try {
      const results = await discoverRisks(randomCat.id);
      setItems(results);
    } catch (error) {
       alert("巡查失败，网络连接可能不稳定。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <ShieldAlert className="w-6 h-6 text-blue-600" />
                 全网风险广告自动巡查
               </h3>
               <p className="text-sm text-slate-500 mt-1">自动检索最近6个月内的违规广告（涵盖微信公众号、小程序推广等）</p>
            </div>
            <button
              onClick={handleAutoPatrol}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isLoading ? "智能巡查中..." : "开始全网巡查"}
            </button>
         </div>

         {/* Category Filter Pills */}
         <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSearch(cat.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive 
                      ? 'bg-white border-blue-300 shadow-sm text-blue-700 ring-2 ring-blue-100' 
                      : 'bg-slate-100 border-transparent text-slate-500 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {cat.name}
                </button>
              )
            })}
         </div>
      </div>

      <div className="p-0">
        {isLoading && (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="font-medium text-slate-600">AI 正在深度检索 {CATEGORIES.find(c=>c.id === currentCategory)?.name} 类违规线索...</p>
            <p className="text-xs mt-2 max-w-xs mx-auto">正在分析微信公众号文章、小程序推广页及相关评论数据...</p>
          </div>
        )}

        {!isLoading && hasSearched && items.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <RefreshCw className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">当前分类下暂未发现高风险线索</p>
            <p className="text-xs mt-2">建议切换分类或点击“开始全网巡查”重试</p>
          </div>
        )}
        
        {!isLoading && !hasSearched && (
           <div className="py-20 text-center text-slate-400">
             <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Search className="w-8 h-8 text-blue-400" />
             </div>
             <p className="font-medium text-slate-700">点击上方按钮开始自动寻找违法违规线索</p>
             <p className="text-xs mt-2 text-slate-400">支持医药、医美、食品保健等重点领域专项排查</p>
           </div>
        )}

        {items.length > 0 && (
           <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-100 text-xs text-yellow-800 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>发现 {items.length} 条疑似违规线索（仅供参考，请以实际校验为准）</span>
           </div>
        )}

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {item.source || '微信公众号'}
                  </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline line-clamp-1 text-sm md:text-base">
                    {item.title}
                  </a>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-2 bg-slate-50/50 p-2 rounded border border-slate-100/50">
                  <span className="text-red-500 font-medium text-xs mr-1">疑似违规点:</span>
                  {item.snippet}
                </p>
                <div className="text-[10px] text-slate-400 truncate font-mono flex gap-2">
                   <span>{item.url.substring(0, 50)}...</span>
                </div>
              </div>
              
              <button
                onClick={() => onAnalyzeItem(item.url)}
                className="shrink-0 flex items-center gap-1 bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
              >
                一键校验
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        {items.length > 0 && (
           <div className="p-4 bg-slate-50 text-center">
              <button 
                onClick={() => handleSearch(currentCategory)} 
                className="text-xs text-slate-500 hover:text-blue-600 underline flex items-center justify-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3 h-3" />
                换一批 / 重新搜索
              </button>
           </div>
        )}
      </div>
    </div>
  );
};