
import React, { useState, useRef, useEffect } from 'react';
import { InputMode } from '../types';
import { FileText, Link as LinkIcon, Sparkles, ClipboardPaste, ImagePlus, X, ScanSearch, Loader2, ShoppingBag, MessageSquareText } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (content: string, images: string[], mode: InputMode, url?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
  onModeChange?: () => void;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, isLoading, initialUrl, onModeChange }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.TEXT);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUrl) {
      handleModeSwitch(InputMode.URL);
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleModeSwitch = (newMode: InputMode) => {
    // CRITICAL: Strictly clear all input data when switching modes
    // This ensures detection results and inputs do not bleed into the other category.
    setText('');
    setUrl('');
    setImages([]);
    
    setMode(newMode);
    
    // Notify parent to clear current analysis results
    if (onModeChange) onModeChange();
  };

  // Image Compression Utility
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if larger than 1024px
          const MAX_WIDTH = 1024;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      const newImages: string[] = [];
      const files = Array.from(e.target.files) as File[];
      
      try {
        for (const file of files) {
          // Only process images
          if (file.type.startsWith('image/')) {
            const compressed = await compressImage(file);
            newImages.push(compressed);
          }
        }
        setImages(prev => [...prev, ...newImages]);
      } catch (err) {
        console.error("Image processing error", err);
        alert("图片处理失败，请重试");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompressing) return; // Prevent submit while processing
    
    if (!text.trim() && images.length === 0 && mode === InputMode.TEXT) {
      alert("请至少提供广告文案或上传广告图片。");
      return;
    }

    if (mode === InputMode.URL && !url.trim()) {
       alert("请输入有效的商品链接或路径");
       return;
    }

    onAnalyze(text, images, mode, url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-100">
        <button
          onClick={() => handleModeSwitch(InputMode.TEXT)}
          className={`py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            mode === InputMode.TEXT
              ? 'text-indigo-600 bg-white'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MessageSquareText className="w-4 h-4" />
          文案/图片校验 (微信推文)
          {mode === InputMode.TEXT && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 mx-12 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => handleModeSwitch(InputMode.URL)}
          className={`py-4 text-sm font-medium flex items-center justify-center gap-2 transition-all relative ${
            mode === InputMode.URL
              ? 'text-indigo-600 bg-white'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          链接/小程序校验 (电商购物)
          {mode === InputMode.URL && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 mx-12 rounded-t-full"></div>}
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {mode === InputMode.TEXT ? (
          <div className="space-y-6">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
               <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                 <FileText className="w-4 h-4" />
                 <span><span className="font-bold">仅适用场景：</span>微信公众号文章、朋友圈文案、线下海报宣传单。</span>
               </p>
            </div>
            <div>
              <label htmlFor="ad-text" className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                <span>微信推文 / 广告文案内容</span>
                <span className="text-xs font-normal text-slate-400">支持直接粘贴</span>
              </label>
              <textarea
                id="ad-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请粘贴公众号文章全文或广告文案..."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-300 text-sm leading-relaxed bg-slate-50/50"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
               <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                 <ShoppingBag className="w-4 h-4" />
                 <span><span className="font-bold">仅适用场景：</span>淘宝/京东/拼多多/抖音/快手等商品详情页。</span>
               </p>
            </div>
            <div>
              <label htmlFor="ad-url" className="block text-sm font-bold text-slate-700 mb-2">
                电商商品链接 / 小程序路径 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="ad-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="请输入淘宝/京东/拼多多商品链接..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm bg-slate-50/50"
                  required
                />
                <LinkIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="bg-blue-50/50 text-blue-800 p-5 rounded-xl flex items-start gap-4 text-sm border border-blue-100">
              <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                <ClipboardPaste className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-blue-900 mb-1">详情页文字内容 (必填)</p>
                <p className="text-blue-700/80 leading-relaxed text-xs md:text-sm">
                  受限于各电商平台及小程序的隐私保护机制，系统无法直接抓取外部链接内容。
                  <br/>
                  <span className="font-bold underline decoration-blue-300">请您务必手动复制</span> 详情页中的关键宣传文字粘贴到下方。
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="url-text-content" className="block text-sm font-bold text-slate-700 mb-2">
                商品详情/宣传文案 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="url-text-content"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请将商品详情页的文字内容粘贴到这里..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 placeholder:text-slate-300 text-sm bg-slate-50/50"
              />
            </div>
          </div>
        )}

        {/* Shared Image Upload Section */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <ScanSearch className="w-4 h-4 text-indigo-500" />
            {mode === InputMode.TEXT ? '推文截图 / 宣传海报 (可选)' : '商品参数页 / 标签截图 (推荐)'}
            {isCompressing && <span className="text-xs font-normal text-indigo-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 图片压缩中...</span>}
          </label>
          <p className="text-xs text-slate-500 mb-4 bg-orange-50 border-l-2 border-orange-400 p-2">
             AI将自动识别图片中的违规文字。
             {mode === InputMode.URL && (
                 <>
                  <b className="text-orange-700 block mt-1">⚠️ 电商校验建议上传【商品参数页】或【产品背标】截图</b>
                  <span className="text-orange-600">以便精准判定 OTC/保健食品/医疗器械 资质。</span>
                 </>
             )}
             {mode === InputMode.TEXT && (
                 <span className="text-orange-600">支持上传长图或多张截图，系统将合并分析。</span>
             )}
          </p>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
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
              disabled={isCompressing}
              className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl transition-all bg-slate-50 ${
                isCompressing ? 'cursor-wait opacity-50' : 'text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30'
              }`}
            >
              {isCompressing ? (
                 <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              ) : (
                <>
                 <ImagePlus className="w-6 h-6 mb-1.5 opacity-50" />
                 <span className="text-[10px] font-medium">点击上传</span>
                </>
              )}
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

        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading || isCompressing}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-[0.99] ${
              (isLoading || isCompressing)
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
