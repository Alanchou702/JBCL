import React, { useState, useRef, useEffect } from 'react';
import { InputMode } from '../types';
import { FileText, Link as LinkIcon, Sparkles, ClipboardPaste, ImagePlus, X } from 'lucide-react';

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
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setMode(InputMode.TEXT)}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === InputMode.TEXT
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          文案/图片校验
        </button>
        <button
          onClick={() => setMode(InputMode.URL)}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === InputMode.URL
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          链接/小程序校验
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        {mode === InputMode.TEXT ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="ad-text" className="block text-sm font-semibold text-slate-700 mb-2">
                广告创意/文案内容
              </label>
              <textarea
                id="ad-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在此粘贴广告文案、朋友圈推文内容..."
                className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="ad-url" className="block text-sm font-semibold text-slate-700 mb-2">
                推广链接 / 小程序路径 <span className="text-red-500">*</span>
              </label>
              <input
                id="ad-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="示例：https://mp.weixin.qq.com/... 或 #小程序://..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-400 mt-1">支持微信公众号文章链接、小程序路径（如 #小程序://...）等</p>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm border border-blue-100">
              <ClipboardPaste className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <p className="font-semibold mb-1">请粘贴正文内容</p>
                <p className="text-blue-700/80">
                  由于微信等平台的隐私限制，系统无法直接抓取内容。请务必将网页/小程序页面的文字复制到下方。如果是图片广告，请在下方上传截图。
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="url-text-content" className="block text-sm font-semibold text-slate-700 mb-2">
                文章/页面正文
              </label>
              <textarea
                id="url-text-content"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请将打开链接后的页面文字内容粘贴到这里..."
                className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* Shared Image Upload Section */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            图片/截图上传 (支持多图)
          </label>
          <p className="text-xs text-slate-500 mb-3">
             强烈建议上传包含<b>阅读量、销量数据、发布日期</b>的截图，AI将自动提取并在举报文案中作为佐证。
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                <img src={img} alt={`Uploaded ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors bg-slate-50"
            >
              <ImagePlus className="w-8 h-8 mb-2" />
              <span className="text-xs">点击上传</span>
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
           <div className="mt-4">
              <label htmlFor="ref-url-opt" className="block text-sm font-semibold text-slate-700 mb-2">
               原文链接 (可选)
             </label>
             <input 
               id="ref-url-opt"
               type="text"
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder="https://... 或 #小程序://..."
               className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
             />
           </div>
        )}

        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg text-white font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>法规校验中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>立即合规校验</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
