import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  GitBranch,
  Code2,
  Network,
  BookOpen,
  MessageSquare,
  Loader2,
  FileText,
  Layers,
} from "lucide-react";
import { getProject, analyzeAST, analyzeArchitecture, chat } from "../services/api";
import type { Project } from "../types";
import DirectoryTree from "../components/DirectoryTree";
import MermaidDiagram from "../components/MermaidDiagram";
import ChatPanel from "../components/ChatPanel";

type Tab = "overview" | "structure" | "architecture" | "readme" | "chat";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadProject = async () => {
    if (!id) return;
    try {
      const p = await getProject(Number(id));
      setProject(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleRunAST = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await analyzeAST(Number(id));
      await loadProject();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunArchitecture = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await analyzeArchitecture(Number(id));
      await loadProject();
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-16 text-gray-500">项目未找到</div>;
  }

  const techStack: string[] = project.tech_stack ? JSON.parse(project.tech_stack) : [];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "概览", icon: <Layers className="w-4 h-4" /> },
    { key: "structure", label: "目录结构", icon: <Code2 className="w-4 h-4" /> },
    { key: "architecture", label: "架构图", icon: <Network className="w-4 h-4" /> },
    { key: "readme", label: "README", icon: <FileText className="w-4 h-4" /> },
    { key: "chat", label: "RepoChat", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {project.status}
          </span>
        </div>
        <p className="text-gray-500 text-sm">{project.repo_url}</p>
        {techStack.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {techStack.map((t) => (
              <span key={t} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary-50 text-primary-700 border border-primary-200"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[500px]">
        {tab === "overview" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">项目概述</h2>
            {project.overview ? (
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {project.overview}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">尚未生成项目概述</p>
                <button
                  onClick={handleRunArchitecture}
                  disabled={analyzing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                  {analyzing ? "AI 分析中..." : "运行 AI 架构分析"}
                </button>
              </div>
            )}

            {project.learning_path && (
              <div className="mt-8">
                <h3 className="text-md font-semibold mb-3">学习路径</h3>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4">
                  {project.learning_path}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "structure" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">目录结构</h2>
            {project.directory_tree ? (
              <DirectoryTree tree={project.directory_tree} />
            ) : (
              <p className="text-gray-500 text-center py-12">暂无目录结构数据</p>
            )}
          </div>
        )}

        {tab === "architecture" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">架构图</h2>
            {project.architecture_diagram ? (
              <MermaidDiagram chart={project.architecture_diagram} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">尚未生成架构图</p>
                <button
                  onClick={handleRunArchitecture}
                  disabled={analyzing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Network className="w-4 h-4" />
                  )}
                  {analyzing ? "生成中..." : "生成架构图"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "readme" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">README</h2>
            {project.readme_content ? (
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {project.readme_content}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">尚未生成 README</p>
                <button
                  onClick={handleRunArchitecture}
                  disabled={analyzing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {analyzing ? "生成中..." : "生成 README"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "chat" && <ChatPanel projectId={project.id} />}
      </div>
    </div>
  );
}
