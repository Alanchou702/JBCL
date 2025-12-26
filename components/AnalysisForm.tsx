
import React, { useState, useRef, useEffect } from 'react';
import { InputMode } from '../types';
import { Sparkles, ImagePlus, X, Loader2, ShoppingBag, Scan, ShieldAlert, Link as LinkIcon, Camera, LayoutGrid, Trash2 } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (content: string, images: string[], mode: InputMode, url?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
  onModeChange?: () => void;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, isLoading, initialUrl, onModeChange }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.URL);
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl) { setUrl(initialUrl); setMode(InputMode.URL); }
  }, [initialUrl]);

  const handleModeSwitch = (newMode: InputMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setUrl(''); 
    setImages([]);
    if (onModeChange) onModeChange();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > 1600) { h *= 1600 / w; w = 1600; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      const files = Array.from(e.target.files) as File[];
      const processed = await Promise.all(files.map(f => compressImage(f)));
      setImages(prev => [...prev, ...processed].slice(0, 15));
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === InputMode.URL && !url) return alert("请输入目标链接或小程序路径");
    if (images.length === 0 && mode === InputMode.TEXT) return alert("请上传至少一张素材截图作为审计证据");
    onAnalyze("", images, mode, url);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800/80 overflow-hidden shadow-2xl ring-1 ring-white/5 relative">
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/50">
        <div className="grid grid-cols-2 bg-slate-950 rounded-2xl p-1.5 relative border border-slate-800/40 shadow-inner">
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-xl shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${mode === InputMode.TEXT ? 'translate-x-full' : 'translate-x-0'}`}
          ></div>
          <button
            type="button"
            onClick={() => handleModeSwitch(InputMode.URL)}
            className={`relative z-10 py-3.5 text-[11px] font-black tracking-widest flex items-center justify-center gap-2.5 transition-colors ${mode === InputMode.URL ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <ShoppingBag className={`w-4 h-4 transition-transform ${mode === InputMode.URL ? 'scale-110' : ''}`} /> 
            <span>全维综合审计</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch(InputMode.TEXT)}
            className={`relative z-10 py-3.5 text-[11px] font-black tracking-widest flex items-center justify-center gap-2.5 transition-colors ${mode === InputMode.TEXT ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Scan className={`w-4 h-4 transition-transform ${mode === InputMode.TEXT ? 'scale-110' : ''}`} /> 
            <span>快速图文扫描</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {mode === InputMode.URL && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Repository / URL</label>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-slate-400 font-bold">双引擎巡航就绪</span>
              </div>
            </div>
            <div className="relative group">
              {/* 链接粘贴框稍微大一点 - 增加 py 从 4.5 到 6 */}
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="粘贴商品链接、推文URL或小程序路径..."
                className="w-full pl-12 pr-4 py-6 bg-slate-950/80 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-indigo-300 font-mono text-xs transition-all placeholder:text-slate-700 shadow-inner outline-none"
              />
              <LinkIcon className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">证据包 (Evidence Stack)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${images.length > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-600'}`}>
                {images.length} / 15
              </span>
            </div>
            {images.length > 0 && (
              <button 
                type="button" 
                onClick={() => setImages([])}
                className="text-[9px] font-bold text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
              >
                <X className="w-3 h-3" /> 重置全部
              </button>
            )}
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group/upload border-2 border-dashed rounded-[2rem] transition-all duration-700 relative overflow-hidden cursor-pointer flex flex-col items-center justify-center
              ${images.length > 0 ? 'py-8 bg-slate-950/20 border-slate-800' : 'py-16 bg-slate-950/40 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-950/60'}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity"></div>
            
            <div className={`transition-all duration-500 flex flex-col items-center ${images.length > 0 ? 'opacity-40 group-hover/upload:opacity-100' : ''}`}>
              <div className={`bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl transition-all duration-500 
                ${images.length > 0 ? 'w-12 h-12 mb-3' : 'w-20 h-20 mb-5 group-hover/upload:bg-indigo-600 group-hover/upload:scale-110 group-hover/upload:rotate-6'}
              `}>
                {isCompressing ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : images.length > 0 ? (
                  <Camera className="w-6 h-6 text-slate-400 group-hover/upload:text-white" />
                ) : (
                  <ImagePlus className="w-10 h-10 text-slate-700 group-hover/upload:text-white" />
                )}
              </div>
              <p className={`font-black tracking-tight transition-all ${images.length > 0 ? 'text-[11px] text-slate-400 uppercase tracking-widest' : 'text-base text-white'}`}>
                {images.length > 0 ? '继续向证据包添加图片' : '上传/拖入审计素材证据'}
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="bg-slate-950/80 rounded-3xl border border-slate-800/60 p-4 shadow-inner ring-1 ring-white/5">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {images.map((img, i) => (
                  <div key={i} className="group/img relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-800/50 bg-slate-900 hover:border-indigo-500/50 transition-all animate-in zoom-in-90 duration-300 shadow-lg">
                    <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" />
                    
                    <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-white border border-white/10 z-10">
                      ID-{String(i + 1).padStart(2, '0')}
                    </div>
                    
                    {/* 更便捷的删除方式 - 按钮更显眼，增加半透明背景且常态显示一小部分 */}
                    <button 
                      type="button" 
                      onClick={(e) => {e.stopPropagation(); setImages(prev => prev.filter((_, idx) => idx !== i))}} 
                      className="absolute top-1.5 right-1.5 w-8 h-8 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all shadow-xl z-20 group-hover/img:scale-110 active:scale-90 border border-white/20"
                      title="删除图片"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/50 overflow-hidden">
                       <div className="h-full bg-indigo-400 w-full animate-[loading_2.5s_infinite]"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-950/40 p-5 rounded-[1.5rem] border border-slate-800/50 flex items-start gap-4">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-200 font-black uppercase tracking-wider">证据存证规范声明</p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                素材图片将由 Gemini 3.0 Pro 引擎进行深度法律语义扫描。支持最多 15 张图片同步入库。
              </p>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

        <button
          type="submit"
          disabled={isLoading || isCompressing}
          className={`group/btn w-full py-6 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all relative overflow-hidden active:scale-[0.97] ${
            isLoading ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)]'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6 group-hover/btn:animate-pulse" />
          )}
          <span className="relative z-10">{isLoading ? '引擎深度巡航中' : '执行全维法理审计'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2.5s_infinite] pointer-events-none"></div>
        </button>
      </form>

      <style>{`
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(2, 6, 23, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
};
