
import React, { useState, useRef, useCallback } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { GeminiService } from './services/geminiService';
import { ToolType, GeneratedImage } from './types';
import { 
  Palette, 
  Eraser, 
  RefreshCw, 
  Download, 
  // Fix: MagicWand is not an exported member of lucide-react, using Wand2 instead
  Wand2, 
  Sparkles, 
  Trash2,
  ChevronRight,
  History,
  Info,
  PenTool
} from 'lucide-react';

const STYLES = [
  { id: 'realistic', label: '写实主义', prompt: 'hyper-realistic digital painting, 8k, detailed, professional lighting' },
  { id: 'oil', label: '油画', prompt: 'thick oil painting texture, impressionist, artistic brushstrokes' },
  { id: 'anime', label: '二次元', prompt: 'high-quality anime style, vibrant colors, clean lines, masterwork' },
  { id: 'cyberpunk', label: '赛博朋克', prompt: 'cyberpunk aesthetics, neon lights, futuristic, rainy street' },
  { id: 'watercolor', label: '水彩画', prompt: 'soft watercolor textures, flowing colors, dreamy, aesthetic' },
  { id: 'sketch', label: '精致素描', prompt: 'highly detailed pencil sketch, architectural shading, fine art' },
  { id: 'pixel', label: '像素风', prompt: 'pixel art style, 8-bit, retro game aesthetic, sharp pixels, vibrant colors, high detail pixelated masterpiece' }
];

export default function App() {
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<ToolType>(ToolType.BRUSH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gemini = GeminiService.getInstance();

  const handleCanvasChange = useCallback((dataUrl: string) => {
    setHasDrawn(true);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setCurrentResult(null);
    setDescription('');
    setHasDrawn(false);
  };

  const generateArt = async (stylePrompt: string) => {
    if (!canvasRef.current || !hasDrawn) {
        alert("请先在画布上画点什么吧！");
        return;
    }
    setIsGenerating(true);
    setCurrentResult(null);
    
    try {
      const sketchData = canvasRef.current.toDataURL();
      const result = await gemini.transformSketch(sketchData, stylePrompt);
      
      if (result) {
        setCurrentResult(result);
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: result,
          prompt: stylePrompt,
          timestamp: Date.now()
        };
        setHistory(prev => [newImage, ...prev].slice(0, 10));
      }
    } catch (err) {
      console.error(err);
      alert("生成失败，请检查 API Key 或稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeSketch = async () => {
    if (!canvasRef.current || !hasDrawn) return;
    setIsGenerating(true);
    try {
      const sketchData = canvasRef.current.toDataURL();
      const desc = await gemini.describeSketch(sketchData);
      setDescription(desc);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `doodle-genius-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">随心画 <span className="text-indigo-400">Doodle Genius</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Gemini AI Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={analyzeSketch}
              disabled={isGenerating || !hasDrawn}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 rounded-full transition-all disabled:opacity-30 border border-slate-700"
            >
              <Info size={16} className="text-indigo-400" />
              AI 解读
            </button>
            <button 
              onClick={clearCanvas}
              className="p-2.5 bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all border border-slate-700"
              title="清除画布"
            >
              <Trash2 size={20} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Toolbar */}
        <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-8 gap-8 z-20 shrink-0">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setTool(ToolType.BRUSH)}
              className={`p-3.5 rounded-2xl transition-all ${tool === ToolType.BRUSH ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              title="画笔"
            >
              <PenTool size={24} />
            </button>
            <button 
              onClick={() => setTool(ToolType.ERASER)}
              className={`p-3.5 rounded-2xl transition-all ${tool === ToolType.ERASER ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
              title="橡皮擦"
            >
              <Eraser size={24} />
            </button>
          </div>

          <div className="w-10 h-px bg-slate-800" />

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-xl border-2 border-slate-700 cursor-pointer overflow-hidden bg-transparent p-0"
                style={{ appearance: 'none' }}
                title="选择颜色"
              />
              <div className="absolute -right-2 -top-2 w-3 h-3 rounded-full border border-slate-900 bg-white group-hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-1.5 bg-slate-800 rounded-full relative">
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  // Fix: Type '"slider-vertical"' is not assignable to type 'Appearance', using WebkitAppearance with cast to fix TS error
                  style={{ WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
                />
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-full transition-all duration-100"
                  style={{ height: `${(brushSize / 50) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{brushSize}px</span>
            </div>
          </div>
        </aside>

        {/* Center Canvas Area */}
        <section className="flex-1 relative flex flex-col overflow-hidden bg-slate-950/50">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-lg px-4">
            {description && (
              <div className="bg-slate-900/95 border border-indigo-500/30 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-medium text-indigo-100 leading-relaxed text-center">
                  <Sparkles size={16} className="inline-block mr-2 text-indigo-400 animate-pulse" />
                  {description}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 md:p-10 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full max-w-5xl bg-slate-800 rounded-[2rem] overflow-hidden border-[6px] border-slate-800 shadow-2xl transition-all duration-300 group">
              <DrawingCanvas 
                color={color}
                brushSize={brushSize}
                tool={tool}
                onCanvasChange={handleCanvasChange}
                canvasRef={canvasRef}
              />
              
              {!hasDrawn && !isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                   <PenTool size={64} className="mb-4" />
                   <p className="text-xl font-medium">在此开始你的创作</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">正在施展 AI 魔法</h3>
                    <p className="text-sm text-slate-400">正在将您的灵感转化为杰作...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Style Selector */}
          <div className="px-8 pb-10 flex flex-col items-center shrink-0">
             <div className="mb-5 text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
               <div className="w-8 h-px bg-slate-800" />
               选择艺术风格以转换
               <div className="w-8 h-px bg-slate-800" />
             </div>
             <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
               {STYLES.map((style) => (
                 <button
                   key={style.id}
                   onClick={() => generateArt(style.prompt)}
                   disabled={isGenerating}
                   className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-400 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg"
                 >
                   {style.label}
                 </button>
               ))}
             </div>
          </div>
        </section>

        {/* Right Sidebar - Result & History */}
        <aside className="hidden lg:flex w-80 bg-slate-900 border-l border-slate-800 flex-col shrink-0 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold flex items-center gap-2 text-indigo-400">
                <Sparkles size={18} />
                生成预览
              </h2>
            </div>
            
            <div className="mb-8">
              {currentResult ? (
                <div className="group relative rounded-3xl overflow-hidden border border-slate-700 aspect-square shadow-2xl animate-in zoom-in duration-500">
                  <img src={currentResult} alt="Generated Art" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button 
                      onClick={() => downloadImage(currentResult)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
                    >
                      <Download size={18} />
                      下载高清原图
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-700 p-8 text-center bg-slate-950/20">
                  {/* Fix: Replace MagicWand with Wand2 which is available in lucide-react */}
                  <Wand2 size={48} className="mb-4 opacity-10" />
                  <p className="text-sm font-medium">等待灵感降临</p>
                  <p className="text-[11px] mt-2 text-slate-600">在左侧画板涂鸦后点击风格按钮</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h2 className="font-bold mb-5 flex items-center gap-2 text-slate-500 uppercase text-[10px] tracking-[0.2em]">
                <History size={14} />
                艺术长廊
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {history.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentResult(img.url)}
                    className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-indigo-500 transition-all group shadow-md"
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="History" />
                    <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                {history.length === 0 && (
                  <div className="col-span-2 py-10 text-center flex flex-col items-center opacity-20">
                    <History size={24} className="mb-2" />
                    <span className="text-xs">暂无历史</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
