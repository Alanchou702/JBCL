import React from 'react';
import { HistoryItem } from '../types';
import { History, Clock, ChevronRight, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          最近校验记录 (最近20条)
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          清空记录
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800 truncate block">
                    {item.productName || "未知主体"}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    item.result.isAd 
                      ? 'bg-orange-50 text-orange-600 border-orange-100' 
                      : 'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {item.result.isAd ? '广告' : '非广告'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString('zh-CN', { 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="truncate max-w-[200px] text-slate-400">
                     {item.result.violations.length > 0 
                        ? `${item.result.violations.length} 处违规风险` 
                        : "无明显违规"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};