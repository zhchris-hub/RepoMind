import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, GitBranch, Code2 } from "lucide-react";
import type { Project } from "../types";

interface DemoProjectsProps {
  projects: Project[];
}

export default function DemoProjects({ projects }: DemoProjectsProps) {
  const navigate = useNavigate();
  const demos = projects.filter((p) => p.is_demo);

  if (demos.length === 0) return null;

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Play className="w-4 h-4 text-primary-500" />
        <h2 className="text-sm font-semibold text-dark-600 uppercase tracking-wider">演示项目</h2>
        <span className="px-2 py-0.5 rounded-full bg-primary-50 text-xs text-primary-500 font-medium border border-primary-200">
          无需 API Key
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {demos.map((p, i) => {
          const techStack: string[] = p.tech_stack ? JSON.parse(p.tech_stack) : [];
          return (
            <motion.div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="glass-card p-4 cursor-pointer group relative overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-bold tracking-wider border border-primary-500/20">
                  DEMO
                </span>
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-dark-100 flex items-center justify-center border border-black/[0.04]">
                  <GitBranch className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dark-700 group-hover:text-primary-500 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-dark-400 font-mono truncate max-w-[180px]">
                    {p.repo_url.replace("https://github.com/", "")}
                  </p>
                </div>
              </div>

              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-dark-50 text-[11px] text-dark-500 border border-black/[0.04]"
                    >
                      <Code2 className="w-3 h-3" />
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
