import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  GitBranch,
  Code2,
  Network,
  BookOpen,
  MessageSquare,
  Loader2,
  FileText,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getProject, analyzeArchitecture } from "../services/api";
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
      return p;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  // Poll while analysis is in progress
  useEffect(() => {
    if (!id || loading) return;
    if (project && project.status === "completed") return;

    const interval = setInterval(async () => {
      const p = await loadProject();
      if (p && p.status === "completed") {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, loading, project?.status]);

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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-blue flex items-center justify-center animate-pulse-glow">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <div className="absolute inset-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-blue blur-xl opacity-40" />
        </div>
        <p className="text-dark-400 text-sm">加载项目中...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-dark-400 text-lg">项目未找到</p>
      </div>
    );
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
    <LayoutGroup>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-blue/20 flex items-center justify-center border border-white/[0.06]">
              <GitBranch className="w-5 h-5 text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold text-dark-800">{project.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                project.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  project.status === "completed" ? "bg-emerald-400 animate-pulse-glow" : "bg-accent-blue"
                }`}
              />
              {project.status}
            </span>
          </div>
          <p className="text-dark-400 text-sm font-mono ml-[52px]">{project.repo_url}</p>
          {project.status !== "completed" && (
            <motion.div
              className="flex items-center gap-2 mt-2 ml-[52px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-3.5 h-3.5 text-primary-400 animate-spin" />
              <span className="text-xs text-primary-400">AI 分析进行中，页面会自动更新...</span>
            </motion.div>
          )}
          {techStack.length > 0 && (
            <div className="flex gap-2 mt-3 ml-[52px] flex-wrap">
              {techStack.map((t, i) => (
                <motion.span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-primary-500/10 to-accent-blue/10 text-primary-300 border border-white/[0.06]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  {t}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tab Bar */}
        <motion.div
          className="flex gap-1 mb-6 glass rounded-xl p-1.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                tab === t.key
                  ? "text-dark-800"
                  : "text-dark-400 hover:text-dark-600"
              }`}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-white/[0.08] rounded-lg border border-white/[0.08]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content Panel */}
        <motion.div
          className="glass-card p-6 min-h-[500px] relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4 text-dark-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-400" />
                  项目概述
                </h2>
                {project.overview ? (
                  <article className="prose max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{project.overview}</Markdown>
                  </article>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-blue/10 flex items-center justify-center border border-white/[0.06]">
                      <BookOpen className="w-8 h-8 text-dark-400" />
                    </div>
                    <p className="text-dark-400 mb-6">尚未生成项目概述</p>
                    <AIButton onClick={handleRunArchitecture} loading={analyzing} icon={<Sparkles className="w-4 h-4" />}>
                      {analyzing ? "AI 分析中..." : "重新分析"}
                    </AIButton>
                  </div>
                )}

                {project.learning_path && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/[0.06]">
                      <BookOpen className="w-5 h-5 text-primary-400" />
                      <h3 className="text-lg font-semibold text-dark-800">学习路径</h3>
                    </div>
                    <article className="prose max-w-none bg-white/[0.02] rounded-xl p-6 border border-white/[0.04]">
                      <Markdown remarkPlugins={[remarkGfm]}>{project.learning_path}</Markdown>
                    </article>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "structure" && (
              <motion.div
                key="structure"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4 text-dark-800 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary-400" />
                  目录结构
                </h2>
                {project.directory_tree ? (
                  <DirectoryTree tree={project.directory_tree} />
                ) : (
                  <p className="text-dark-400 text-center py-16">暂无目录结构数据</p>
                )}
              </motion.div>
            )}

            {tab === "architecture" && (
              <motion.div
                key="architecture"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4 text-dark-800 flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary-400" />
                  架构图
                </h2>
                {project.architecture_diagram ? (
                  <MermaidDiagram chart={project.architecture_diagram} />
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-blue/10 flex items-center justify-center border border-white/[0.06]">
                      <Network className="w-8 h-8 text-dark-400" />
                    </div>
                    <p className="text-dark-400 mb-6">尚未生成架构图</p>
                    <AIButton onClick={handleRunArchitecture} loading={analyzing} icon={<Zap className="w-4 h-4" />}>
                      {analyzing ? "生成中..." : "重新生成"}
                    </AIButton>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "readme" && (
              <motion.div
                key="readme"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold mb-4 text-dark-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  README
                </h2>
                {project.readme_content ? (
                  <article className="prose max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{project.readme_content}</Markdown>
                  </article>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-blue/10 flex items-center justify-center border border-white/[0.06]">
                      <FileText className="w-8 h-8 text-dark-400" />
                    </div>
                    <p className="text-dark-400 mb-6">尚未生成 README</p>
                    <AIButton onClick={handleRunArchitecture} loading={analyzing} icon={<Sparkles className="w-4 h-4" />}>
                      {analyzing ? "生成中..." : "重新生成"}
                    </AIButton>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ChatPanel projectId={project.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}

function AIButton({
  onClick,
  loading,
  children,
  icon,
}: {
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className="relative px-6 py-2.5 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto overflow-hidden"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-blue to-primary-600 bg-[length:200%_100%] animate-border-flow" />
      <div className="absolute inset-[1px] rounded-[11px] bg-dark-50" />
      <span className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-primary-300 to-accent-blue bg-clip-text text-transparent">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary-400" /> : icon}
        {children}
      </span>
    </motion.button>
  );
}
