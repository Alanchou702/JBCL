
import React from 'react';
import { AnalysisResult } from '../types';
import { AlertTriangle, ClipboardCopy, Gavel, CalendarClock, ShieldAlert, FileSearch, ShieldCheck, Hash, Lock, CheckCircle, RefreshCcw, Landmark, UserPlus } from 'lucide-react';

interface ResultDisplayProps {
  result: AnalysisResult;
  onReAudit?: () => void;
  canReAudit?: boolean;
  onAddToLibrary?: (name: string) => void;
  isInLibrary?: boolean;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReAudit, canReAudit, onAddToLibrary, isInLibrary }) => {
  const wordCount = result.summary.length;
  const isCorrectCount = wordCount >= 350 && wordCount <= 380;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.summary);
    alert('合规审计存证文案（正式版）已复制至剪贴板');
  };

  if (!result.isAd && result.violations.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-10 text-center backdrop-blur-sm ring-1 ring-white/5">
        <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-white mb-2 tracking-tight">审计通过：未见合规风险</h2>
        <p className="text-slate-500 text-[10px] max-w-xs mx-auto leading-relaxed">
          当前素材未匹配到违规模型，建议作为常规合规档案留存。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10">
      {/* 风险概览状态条 */}
      <div className={`bg-slate-950 border ${result.isDuplicate || isInLibrary ? 'border-amber-500/50' : 'border-slate-800'} rounded-xl p-4 flex items-center justify-between shadow-2xl relative overflow-hidden`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${result.isDuplicate || isInLibrary ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
        
        {(result.isDuplicate || isInLibrary) && (
          <div className="absolute right-0 top-0 bottom-0 px-4 bg-amber-500/10 flex items-center gap-2 border-l border-amber-500/20 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">重复投诉风险主体</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${result.isDuplicate || isInLibrary ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              {result.isDuplicate || isInLibrary ? 'Duplicate Risk' : 'Audit Report'}
            </span>
            <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
              <CalendarClock className="w-3 h-3" /> 审计时间：{result.publicationDate || new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>
          <h2 className="text-lg font-black text-white truncate pr-4">{result.productName}</h2>
        </div>
        <div className={`flex items-center gap-4 border-l ${result.isDuplicate || isInLibrary ? 'border-amber-500/20' : 'border-slate-800'} pl-4 shrink-0`}>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Detected Risks</p>
            <p className={`text-xl font-black tabular-nums leading-none ${result.isDuplicate || isInLibrary ? 'text-amber-500' : 'text-rose-500'}`}>{result.violations.length}</p>
          </div>
          <AlertTriangle className={`w-6 h-6 animate-pulse ${result.isDuplicate || isInLibrary ? 'text-amber-500' : 'text-rose-500'}`} />
        </div>
      </div>

      {/* 官方红头存证公文 - 排版优化 */}
      <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden relative">
        <div className="h-1.5 bg-rose-600 w-full"></div>
        
        {/* 页眉紧凑化：减少 pt-8 pb-4 到 pt-6 pb-3 */}
        <div className="px-8 pt-6 pb-3 text-center border-b border-rose-100 bg-rose-50/30">
          <div className="flex justify-center mb-2">
             <div className="w-10 h-10 border-2 border-rose-600 rounded-full flex items-center justify-center">
                <Landmark className="w-6 h-6 text-rose-600" />
             </div>
          </div>
          <h1 className="text-xl font-black text-rose-600 tracking-[0.2em] mb-1">广告合规审计存证函</h1>
          <div className="flex items-center justify-center gap-4 text-rose-400 font-serif italic text-[10px]">
            <span className="h-px bg-rose-200 w-10"></span>
            AD-COMPLIANCE OFFICIAL RECORD
            <span className="h-px bg-rose-200 w-10"></span>
          </div>
        </div>

        {/* 状态工具栏紧凑化 */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="font-black text-[9px] text-slate-500 uppercase tracking-tight">存证效力：实时生成・逻辑锁定</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* 字数徽章优化：缩小尺寸 */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[9px] font-bold ${isCorrectCount ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse'}`}>
              <Hash className="w-2.5 h-2.5" />
              <span>{wordCount} / 350-380</span>
              {isCorrectCount && <CheckCircle className="w-2.5 h-2.5 ml-0.5" />}
            </div>
            
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
              {onAddToLibrary && (
                <button 
                  onClick={() => onAddToLibrary(result.productName)}
                  disabled={isInLibrary}
                  className={`p-1.5 rounded-lg transition-all border flex items-center gap-1.5 px-2.5 text-[9px] font-black ${isInLibrary ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 border-slate-800 text-white hover:bg-black'}`}
                  title="标记为已投诉对象"
                >
                  <UserPlus className="w-3 h-3" />
                  {isInLibrary ? '已入库' : '投诉入库'}
                </button>
              )}
              {canReAudit && onReAudit && (
                <button 
                  onClick={onReAudit}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-all active:scale-95 border border-slate-200"
                  title="启动法理重审"
                >
                  <RefreshCcw className="w-3 h-3" />
                </button>
              )}
              <button 
                onClick={handleCopy}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                <ClipboardCopy className="w-3 h-3" /> 复制存证
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
             <Landmark className="w-64 h-64 text-slate-900" />
          </div>

          <div className="relative z-10">
            <div className="mb-4 pb-2 border-b border-slate-100 flex justify-between items-end">
               <span className="text-slate-400 font-mono text-[8px]">NO. ADG-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
               <span className="text-slate-400 font-mono text-[8px]">VER: 6.8 TITANIUM</span>
            </div>
            
            <p className="text-slate-800 text-[13px] leading-[1.8] whitespace-pre-wrap font-sans font-medium antialiased text-justify indent-0">
              {result.summary}
            </p>

            <div className="mt-8 flex justify-end">
              <div className="text-right">
                <p className="text-slate-400 text-[9px] font-bold mb-1">审计系统电子签章</p>
                <div className="w-20 h-20 border-2 border-rose-600/20 rounded-full flex items-center justify-center relative overflow-hidden opacity-40 grayscale hover:grayscale-0 transition-all">
                   <div className="absolute inset-0 border-[3px] border-double border-rose-600 m-1 rounded-full flex items-center justify-center">
                      <div className="text-rose-600 font-black text-[9px] leading-tight text-center tracking-tighter scale-75">
                         ADGUARDIAN<br/>AUDIT SEAL
                      </div>
                   </div>
                </div>
                <p className="text-slate-300 font-mono text-[7px] mt-1.5 uppercase">Verified by Gemini 3.0 Pro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 py-2">
          <FileSearch className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">法理分析明细 Evidence Breakdown</span>
          <div className="flex-1 h-px bg-slate-800/40"></div>
        </div>

        {result.violations.map((v, i) => (
          <div key={i} className={`bg-slate-900/40 border ${result.isDuplicate || isInLibrary ? 'border-amber-500/20' : 'border-slate-800/50'} rounded-xl p-4 flex gap-4 group transition-all hover:bg-slate-900/80 hover:border-slate-700`}>
            <div className={`w-8 h-8 bg-slate-950 border ${result.isDuplicate || isInLibrary ? 'border-amber-500/30 text-amber-500' : 'border-slate-800 text-rose-500'} rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 ${result.isDuplicate || isInLibrary ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-600/10 text-rose-400 border-rose-600/20'} text-[8px] font-black rounded border uppercase tracking-wider`}>{v.type}</span>
                  <span className="text-slate-500 text-[9px] font-bold uppercase truncate max-w-[300px]">{v.law}</span>
                </div>
              </div>
              <div className={`bg-slate-950/60 p-3 rounded-lg border-l-2 ${result.isDuplicate || isInLibrary ? 'border-amber-500/50' : 'border-rose-500/50'}`}>
                <p className="text-slate-200 text-[11px] font-medium leading-relaxed italic">"{v.originalText}"</p>
              </div>
              <div className="pl-1">
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  <span className="text-slate-600 font-black mr-2 uppercase text-[9px]">Analysis:</span>
                  {v.explanation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
