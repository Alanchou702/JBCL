import React, { useState } from 'react';
import { DiscoveryItem } from '../types';
import { discoverRisks } from '../services/geminiService';
import { Search, ExternalLink, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

interface DiscoveryPanelProps {
  onAnalyzeItem: (url: string) => void;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ onAnalyzeItem }) => {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setItems([]);
    setHasSearched(true);
    try {
      const results = await discoverRisks();
      setItems(results);
    } catch (error) {
      console.error("Discovery failed", error);
      alert("搜索失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <ShieldAlert className="w-5 h-5 text-blue-600" />
             全网风险广告自动巡查
           </h3>
           <p className="text-sm text-slate-500 mt-1">自动搜索最近6个月内包含“根治”、“包治”、“第一”等高危关键词的广告信息</p>
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isLoading ? "正在巡查..." : "开始巡查 (20-50条)"}
        </button>
      </div>

      <div className="p-0">
        {isLoading && (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
            <p>AI 正在全网检索高风险广告线索...</p>
            <p className="text-xs mt-2">检索范围：微信公众号、新闻门户、医疗/金融类网页</p>
          </div>
        )}

        {!isLoading && hasSearched && items.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <p>本次巡查未发现明显高危线索，请稍后再试。</p>
          </div>
        )}
        
        {!isLoading && !hasSearched && (
           <div className="py-20 text-center text-slate-400">
             <p>点击右上角按钮开始自动寻找违法违规线索</p>
           </div>
        )}

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => (
            <div key={index} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {item.source || 'WEB'}
                  </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline line-clamp-1">
                    {item.title}
                  </a>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                  {item.snippet}
                </p>
                <div className="text-xs text-slate-400 truncate font-mono">
                  {item.url}
                </div>
              </div>
              
              <button
                onClick={() => onAnalyzeItem(item.url)}
                className="shrink-0 flex items-center gap-1 bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300 transition-all opacity-0 group-hover:opacity-100"
              >
                一键校验
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
