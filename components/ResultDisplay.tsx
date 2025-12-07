import React from 'react';
import { AnalysisResult } from '../types';
import { AlertTriangle, CheckCircle, ClipboardCopy, Gavel, FileWarning, CalendarClock } from 'lucide-react';

interface ResultDisplayProps {
  result: AnalysisResult;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(result.summary);
    alert('举报文案已复制到剪贴板');
  };

  if (!result.isAd && result.violations.length === 0) {
     return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mt-6">
             <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-green-800 mb-2">未发现明显违规</h2>
             <p className="text-green-700">系统初筛未发现明显违反《广告法》的内容，或该内容判定为非商业广告。</p>
        </div>
     )
  }

  return (
    <div className="space-y-6 mt-8 animate-fade-in-up">
      {/* Time Validity Warning */}
      {result.isOldArticle && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <CalendarClock className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-800 text-lg">⚠️ 时效性预警：该内容发布已超 6 个月</h3>
            <p className="text-orange-700 text-sm mt-1">
              检测到该文章/内容的发布时间为 <strong>{result.publicationDate || '未知'}</strong>。
              超过6个月的违法行为可能已过行政处罚追溯期（除非违法行为有连续或继续状态）。
              <br/>建议在举报前核实该内容是否仍在持续展示或产生影响。
            </p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
             <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">校验对象 (商品/服务)</h2>
             <p className="text-xl font-bold text-slate-800">{result.productName || "未知主体"}</p>
             {result.publicationDate && (
               <p className="text-xs text-slate-400 mt-1">发布时间：{result.publicationDate}</p>
             )}
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full border border-red-100">
             <AlertTriangle className="w-5 h-5" />
             <span className="font-medium">发现 {result.violations.length} 处合规风险</span>
         </div>
      </div>

      {/* Summary / Report Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg overflow-hidden text-white">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">监管举报/存档文案</h3>
            </div>
            <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
                <ClipboardCopy className="w-3.5 h-3.5" />
                一键复制
            </button>
        </div>
        <div className="p-6 bg-slate-800/50">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {result.summary}
            </p>
        </div>
      </div>

      {/* Detailed Violations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-orange-500" />
                违规详情解析
            </h3>
        </div>
        <div className="divide-y divide-slate-100">
            {result.violations.map((violation, index) => (
                <div key={index} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                    {violation.type}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                                    {violation.law}
                                </span>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-orange-400">
                                <p className="text-xs text-slate-500 font-semibold mb-1">违规原文：</p>
                                <p className="text-slate-800 text-sm italic">"{violation.originalText}"</p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <span className="font-semibold text-slate-900">法律解析：</span>
                                    {violation.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
