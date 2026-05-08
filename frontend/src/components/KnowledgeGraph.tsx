import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import cytoscape from "cytoscape";

interface GraphNode {
  id: string;
  label: string;
  type: "file" | "module";
  functions: number;
  classes: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface FileInfo {
  imports: string[];
  functions: { name: string; line: number }[];
  classes: { name: string; line: number }[];
}

function buildGraph(fileAnalyses: Record<string, FileInfo>) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fileSet = new Set(Object.keys(fileAnalyses));
  const moduleSet = new Set<string>();

  for (const [path, analysis] of Object.entries(fileAnalyses)) {
    nodes.push({
      id: path,
      label: path.split("/").pop() || path,
      type: "file",
      functions: analysis.functions.length,
      classes: analysis.classes.length,
    });

    for (const imp of analysis.imports) {
      const matched = [...fileSet].find(
        (f) => f.includes(imp.replace(".", "/")) || f.includes(imp.split(".")[-1] || "")
      );
      if (matched) {
        edges.push({ source: path, target: matched });
      } else if (!moduleSet.has(imp)) {
        moduleSet.add(imp);
        nodes.push({
          id: `mod:${imp}`,
          label: imp.split("/").pop() || imp,
          type: "module",
          functions: 0,
          classes: 0,
        });
        edges.push({ source: path, target: `mod:${imp}` });
      }
    }
  }

  return { nodes, edges };
}

export default function KnowledgeGraph({ astData }: { astData: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    label: string;
    functions: number;
    classes: number;
  } | null>(null);

  const initGraph = useCallback(() => {
    if (!containerRef.current) return;

    let parsed: { file_analyses: Record<string, FileInfo> };
    try {
      parsed = JSON.parse(astData);
    } catch {
      return;
    }

    const { nodes, edges } = buildGraph(parsed.file_analyses);

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.label,
            type: n.type,
            functions: n.functions,
            classes: n.classes,
            nodeSize: Math.max(20, Math.min(50, 15 + n.functions * 3 + n.classes * 5)),
          },
        })),
        ...edges.map((e, i) => ({
          data: { id: `e${i}`, source: e.source, target: e.target },
        })),
      ],
      style: [
        {
          selector: "node[type='file']",
          style: {
            "background-color": "#0284c7",
            "border-color": "#0ea5e9",
            "border-width": 2,
            label: "data(label)",
            "font-size": "10px",
            color: "#424245",
            "text-valign": "bottom",
            "text-margin-y": 5,
            width: "data(nodeSize)",
            height: "data(nodeSize)",
            "background-opacity": 0.85,
          } as cytoscape.Css.Node,
        },
        {
          selector: "node[type='module']",
          style: {
            "background-color": "#e8e8ed",
            "border-color": "#aeaeb2",
            "border-width": 1,
            label: "data(label)",
            "font-size": "9px",
            color: "#6e6e73",
            "text-valign": "bottom",
            "text-margin-y": 5,
            width: 18,
            height: 18,
            "background-opacity": 0.6,
            shape: "diamond",
          } as cytoscape.Css.Node,
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#d1d5db",
            "target-arrow-color": "#aeaeb2",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.6,
            "curve-style": "bezier",
            opacity: 0.5,
          } as cytoscape.Css.Edge,
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#0ea5e9",
            "border-width": 3,
            "background-color": "#0284c7",
          } as cytoscape.Css.Node,
        },
        {
          selector: ".highlighted",
          style: {
            "background-color": "#0284c7",
            "border-color": "#38bdf8",
            "line-color": "#0ea5e9",
            "target-arrow-color": "#0ea5e9",
            opacity: 1,
          } as cytoscape.Css.Node,
        },
      ],
      layout: {
        name: "cose",
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 60,
        nodeRepulsion: 4000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        animate: true,
        animationDuration: 500,
      },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        label: node.data("label"),
        functions: node.data("functions"),
        classes: node.data("classes"),
      });

      cy.elements().removeClass("highlighted");
      node.addClass("highlighted");
      node.neighborhood("node").addClass("highlighted");
      node.connectedEdges().addClass("highlighted");
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass("highlighted");
      }
    });

    cyRef.current = cy;
  }, [astData]);

  useEffect(() => {
    initGraph();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initGraph]);

  const handleZoomIn = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.3, renderedPosition: { x: 400, y: 300 } });
  const handleZoomOut = () => cyRef.current?.zoom({ level: cyRef.current.zoom() / 1.3, renderedPosition: { x: 400, y: 300 } });
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const toolbar = (
    <div className="flex items-center gap-1">
      <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="缩小">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="放大">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={handleFit} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="适应画布">
        <RotateCcw className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-dark-200 mx-1" />
      <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title={isFullscreen ? "退出全屏" : "全屏"}>
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-white/90 backdrop-blur-2xl flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between px-6 py-3 border-b border-black/[0.06]">
          <span className="text-sm text-dark-400 font-medium">模块依赖图谱</span>
          {toolbar}
        </div>
        <div className="flex-1 relative">
          <div ref={containerRef} className="w-full h-full" />
          {selectedNode && <NodeInfo node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.04] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-dark-50 border-b border-black/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-400">模块依赖图谱</span>
          <span className="text-xs text-dark-300">（点击节点查看详情）</span>
        </div>
        {toolbar}
      </div>
      <div className="relative" style={{ height: 450 }}>
        <div ref={containerRef} className="w-full h-full" />
        {selectedNode && <NodeInfo node={selectedNode} onClose={() => setSelectedNode(null)} />}
      </div>
    </div>
  );
}

function NodeInfo({
  node,
  onClose,
}: {
  node: { id: string; label: string; functions: number; classes: number };
  onClose: () => void;
}) {
  return (
    <motion.div
      className="absolute bottom-3 left-3 glass-card p-3 max-w-xs"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-mono font-medium text-dark-700">{node.label}</p>
          <p className="text-xs text-dark-400 mt-0.5 truncate">{node.id}</p>
          <div className="flex gap-2 mt-1.5">
            {node.functions > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-300">
                {node.functions} 函数
              </span>
            )}
            {node.classes > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-dark-100 text-dark-500">
                {node.classes} 类
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-dark-400 hover:text-dark-600 text-xs p-1">
          ✕
        </button>
      </div>
    </motion.div>
  );
}
