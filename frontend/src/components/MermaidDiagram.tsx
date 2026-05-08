import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Copy, Check, RotateCcw } from "lucide-react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#e0f2fe",
    primaryTextColor: "#1d1d1f",
    primaryBorderColor: "#0ea5e9",
    lineColor: "#aeaeb2",
    secondaryColor: "#f5f5f7",
    tertiaryColor: "#e8e8ed",
    textColor: "#424245",
    mainBkg: "#ffffff",
    nodeBorder: "#0ea5e9",
    clusterBkg: "#f5f5f7",
    clusterBorder: "#d1d5db",
    titleColor: "#1d1d1f",
    edgeLabelBackground: "#ffffff",
  },
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !chart) return;
    setRendered(false);

    const render = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError("");
          setRendered(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "图表渲染失败");
      }
    };

    render();
  }, [chart]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.4));
  const handleReset = () => setZoom(1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setZoom(1);
  };

  const toolbar = (
    <div className="flex items-center gap-1">
      <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="缩小">
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs text-dark-400 w-10 text-center font-mono">
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="放大">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="重置">
        <RotateCcw className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-dark-200 mx-1" />
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="复制 Mermaid 代码">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
      <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title={isFullscreen ? "退出全屏" : "全屏"}>
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-2">图表渲染失败</p>
        <pre className="text-sm text-dark-500 bg-dark-50 p-4 rounded-xl overflow-auto text-left border border-black/[0.06]">
          {chart}
        </pre>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-2xl flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-black/[0.06]">
            <span className="text-sm text-dark-400 font-medium">架构图</span>
            {toolbar}
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <motion.div
              ref={containerRef}
              className="max-w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: rendered ? 1 : 0, scale: zoom }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-dark-50 border-b border-black/[0.04]">
        <span className="text-xs text-dark-400">Mermaid 架构图</span>
        {toolbar}
      </div>
      <div className="overflow-auto p-6 max-h-[600px]">
        <motion.div
          ref={containerRef}
          className="flex justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: rendered ? 1 : 0, y: rendered ? 0 : 10 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
