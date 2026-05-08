import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#7e22ce",
    primaryTextColor: "#e4e4e7",
    primaryBorderColor: "#a855f7",
    lineColor: "#52525b",
    secondaryColor: "#1a1a1e",
    tertiaryColor: "#27272a",
    textColor: "#d4d4d8",
    mainBkg: "#18181b",
    nodeBorder: "#a855f7",
    clusterBkg: "#1a1a1e",
    clusterBorder: "#3f3f46",
    titleColor: "#e4e4e7",
    edgeLabelBackground: "#18181b",
  },
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || !chart) return;

    const render = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "图表渲染失败");
      }
    };

    render();
  }, [chart]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-2">图表渲染失败</p>
        <pre className="text-sm text-dark-500 bg-white/[0.03] p-4 rounded-xl overflow-auto text-left border border-white/[0.06]">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="flex justify-center py-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}
