import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  GitBranch,
  Loader2,
  ArrowRight,
  Clock,
  Network,
  Code2,
  MessageSquare,
} from "lucide-react";
import { analyzeRepo, listProjects } from "../services/api";
import type { Project } from "../types";
import AnalysisOverlay from "../components/AnalysisOverlay";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const demoFeatures = [
  {
    icon: Network,
    title: "架构图",
    desc: "自动生成 Mermaid 系统架构图",
    gradient: "from-primary-500/20 to-accent-blue/20",
    iconColor: "text-primary-400",
    mock: (
      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-16 h-5 rounded bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-300">Frontend</span>
          <span className="text-dark-300">→</span>
          <span className="w-16 h-5 rounded bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue">Backend</span>
        </div>
        <div className="pl-8">
          <span className="text-dark-300">↓</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <span className="w-14 h-5 rounded bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">DB</span>
          <span className="text-dark-300">+</span>
          <span className="w-14 h-5 rounded bg-accent-emerald/20 border border-accent-emerald/30 flex items-center justify-center text-accent-emerald">API</span>
        </div>
      </div>
    ),
  },
  {
    icon: Code2,
    title: "目录结构",
    desc: "智能解析项目文件树",
    gradient: "from-accent-blue/20 to-accent-cyan/20",
    iconColor: "text-accent-blue",
    mock: (
      <div className="space-y-1 text-xs font-mono text-dark-400">
        <div className="flex items-center gap-1.5">
          <span className="text-dark-300">▸</span>
          <span className="text-dark-500">src/</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <span className="text-dark-300">▸</span>
          <span className="text-dark-500">components/</span>
        </div>
        <div className="flex items-center gap-1.5 pl-8">
          <span className="text-dark-300">─</span>
          <span>App.tsx</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <span className="text-dark-300">─</span>
          <span>main.ts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-dark-300">─</span>
          <span>package.json</span>
        </div>
      </div>
    ),
  },
  {
    icon: MessageSquare,
    title: "AI 问答",
    desc: "基于 RAG 的项目级问答",
    gradient: "from-accent-cyan/20 to-accent-emerald/20",
    iconColor: "text-accent-cyan",
    mock: (
      <div className="space-y-2 text-xs">
        <div className="flex justify-end">
          <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-primary-300 max-w-[80%]">
            认证逻辑在哪里？
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-4 h-4 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
            <span className="text-[8px] text-primary-400">AI</span>
          </span>
          <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-dark-400 border border-white/[0.06] max-w-[80%]">
            认证逻辑在 src/auth/ middleware.ts...
          </span>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const project = await analyzeRepo(repoUrl.trim());
      setAnalyzingId(project.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayComplete = (project: Project) => {
    setAnalyzingId(null);
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 pb-16">
      {/* Analysis Overlay */}
      <AnimatePresence>
        {analyzingId && (
          <AnalysisOverlay
            projectId={analyzingId}
            onComplete={handleOverlayComplete}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
        >
          <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-accent-blue bg-clip-text text-transparent">
            30 秒读懂
          </span>
          <br />
          <span className="text-dark-800">任何 GitHub 项目</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base text-dark-500 max-w-lg mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          AI 替你阅读源码。输入仓库链接，获得架构分析、模块文档和智能问答。
        </motion.p>
      </motion.div>

      {/* Input Card */}
      <motion.div
        className="relative mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary-500/30 via-accent-blue/30 to-accent-cyan/30 blur-sm" />
        <div className="glass-card p-5 relative">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="粘贴 GitHub 仓库链接..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-dark-800 placeholder:text-dark-400 transition-all duration-300"
                disabled={loading}
              />
            </div>
            <motion.button
              onClick={handleAnalyze}
              disabled={loading || !repoUrl.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? "分析中..." : "开始分析"}
            </motion.button>
          </div>
          {error && (
            <motion.p
              className="mt-3 text-red-400 text-sm"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Demo Feature Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {demoFeatures.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="glass-card p-5 group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center border border-white/[0.06]`}
              >
                <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-700">{feature.title}</h3>
                <p className="text-xs text-dark-400">{feature.desc}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] min-h-[80px]">
              {feature.mock}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Projects List */}
      {projects.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
            <Clock className="w-4 h-4 text-dark-400" />
            <h2 className="text-sm font-semibold text-dark-600 uppercase tracking-wider">历史项目</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-dark-500 font-medium">
              {projects.length}
            </span>
          </motion.div>

          <div className="space-y-2">
            {projects.map((p) => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                onClick={() => navigate(`/project/${p.id}`)}
                className="group glass-card p-4 cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 relative overflow-hidden"
                whileHover={{ x: 4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/15 to-accent-blue/15 flex items-center justify-center border border-white/[0.06]">
                      <GitBranch className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-dark-700 group-hover:text-primary-300 transition-colors duration-300">
                        {p.name}
                      </h3>
                      <p className="text-xs text-dark-400 font-mono truncate max-w-[300px]">{p.repo_url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : p.status === "parsed"
                            ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                            : "bg-white/[0.06] text-dark-500 border border-white/[0.06]"
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                        p.status === "completed" ? "bg-emerald-400" : p.status === "parsed" ? "bg-accent-blue" : "bg-dark-400"
                      }`} />
                      {p.status === "completed" ? "已完成" : p.status === "parsed" ? "已解析" : p.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-dark-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-dark-400 text-sm">输入一个 GitHub 仓库链接，开始第一次分析</p>
        </motion.div>
      )}
    </div>
  );
}
