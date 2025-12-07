import React, { useState, useRef, useEffect } from 'react';
import { InputMode } from '../types';
import { FileText, Link as LinkIcon, Sparkles, ClipboardPaste, ImagePlus, X, ScanSearch, Loader2 } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (content: string, images: string[], mode: InputMode, url?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, isLoading, initialUrl }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.TEXT);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl) {
      setMode(InputMode.URL);
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [];
      const files = Array.from(e.target.files);
      
      let processedCount = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            newImages.push(reader.result);
          }
          processedCount++;
          if (processedCount === files.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) {
      alert("请至少提供广告文案或上传广告图片。");
      return;
    }

    if (mode === InputMode.URL && !url.trim()) {
       return;
    }

    onAnalyze(text, images, mode, url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-100">
        <button
          onClick={() => setMode(InputMode.TEXT)}
          className={`py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            mode === InputMode.TEXT
              ? 'text-indigo-600 bg-white'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          文案/图片校验
          {mode === InputMode.TEXT && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 mx-12 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setMode(InputMode.URL)}
          className={`py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            mode === InputMode.URL
              ? 'text-indigo-600 bg-white'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          链接/小程序校验
          {mode === InputMode.URL && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 mx-12 rounded-t-full"></div>}
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {mode === InputMode.TEXT ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="ad-text" className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                <span>广告创意/文案内容</span>
                <span className="text-xs font-normal text-slate-400">支持直接粘贴</span>
              </label>
              <textarea
                id="ad-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请在此输入或粘贴广告文案内容..."
                className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-300 text-sm leading-relaxed bg-slate-50/50"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="ad-url" className="block text-sm font-bold text-slate-700 mb-2">
                推广链接 / 小程序路径 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="ad-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="支持淘宝/京东/拼多多链接，或微信公众号/小程序路径"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm bg-slate-50/50"
                  required
                />
                <LinkIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-1">支持：#小程序://...，淘宝/京东/拼多多商品链接等</p>
            </div>

            <div className="bg-blue-50/50 text-blue-800 p-5 rounded-xl flex items-start gap-4 text-sm border border-blue-100">
              <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                <ClipboardPaste className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-blue-900 mb-1">必须手动粘贴正文</p>
                <p className="text-blue-700/80 leading-relaxed text-xs md:text-sm">
                  受限于微信等平台的隐私保护机制，系统无法直接抓取链接内容。请您手动复制网页或小程序页面的文字内容粘贴到下方，以确保合规校验的准确性。
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="url-text-content" className="block text-sm font-bold text-slate-700 mb-2">
                文章/页面正文内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="url-text-content"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请将页面文字内容粘贴到这里..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-300 text-sm bg-slate-50/50"
              />
            </div>
          </div>
        )}

        {/* Shared Image Upload Section */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-indigo-500" />
            图片/截图佐证 (支持多图)
          </label>
          <p className="text-xs text-slate-500 mb-4 bg-orange-50 border-l-2 border-orange-400 p-2">
             AI将自动识别广告语及销量数据。
             <b className="text-orange-700 block mt-1">⚠️ 必须上传【商品参数页】或【产品背标】截图</b>
             <span className="text-orange-600">以便AI查看生产许可证号（SC开头），精准判定商家是否用“普通食品”冒充“保健品/药品”销售。</span>
          </p>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={img} alt={`Uploaded ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all bg-slate-50"
            >
              <ImagePlus className="w-6 h-6 mb-1.5 opacity-50" />
              <span className="text-[10px] font-medium">点击上传</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* URL Input for Text Mode (moved to bottom as optional) */}
        {mode === InputMode.TEXT && (
           <div className="mt-6">
             <label htmlFor="ref-url-opt" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
               原文链接 (选填)
             </label>
             <input 
               id="ref-url-opt"
               type="text"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder="https://... 或 #小程序://..."
               className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-xs bg-slate-50/50"
             />
           </div>
        )}

        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-[0.99] ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>智能引擎校验中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>立即开始合规校验</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};