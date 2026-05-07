import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, GitBranch, Loader2 } from "lucide-react";
import { analyzeRepo, listProjects } from "../services/api";
import type { Project } from "../types";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
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
      navigate(`/project/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          让 AI 理解任意代码仓库
        </h1>
        <p className="text-lg text-gray-600">
          输入 GitHub 仓库链接，数十秒内获得项目架构分析、模块说明和 AI 问答
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="输入 GitHub 仓库链接，如 https://github.com/user/repo"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !repoUrl.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {loading ? "分析中..." : "开始分析"}
          </button>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      </div>

      {projects.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">历史项目</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/project/${p.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{p.repo_url}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : p.status === "parsed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
