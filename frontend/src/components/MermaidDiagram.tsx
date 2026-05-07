import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
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
        <p className="text-red-500 mb-2">图表渲染失败</p>
        <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto text-left">
          {chart}
        </pre>
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center py-4" />;
}
