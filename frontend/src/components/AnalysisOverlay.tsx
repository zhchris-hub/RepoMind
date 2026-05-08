import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { getProject } from "../services/api";
import type { Project, ProgressStep } from "../types";

function parseSteps(raw: string | null): ProgressStep[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function StepIcon({ status }: { status: ProgressStep["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case "active":
      return <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Circle className="w-5 h-5 text-dark-300" />;
  }
}

export default function AnalysisOverlay({
  projectId,
  onComplete,
}: {
  projectId: number;
  onComplete: (project: Project) => void;
}) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [projectName, setProjectName] = useState("");
  const [isDone, setIsDone] = useState(false);

  const poll = useCallback(async () => {
    try {
      const p = await getProject(projectId);
      setProjectName(p.name);
      const parsed = parseSteps(p.progress_steps);
      if (parsed.length > 0) {
        setSteps(parsed);
        const allDone = parsed.every((s) => s.status === "done" || s.status === "error");
        if (allDone) {
          setIsDone(true);
          return true; // stop polling
        }
      }
    } catch {
      // ignore polling errors
    }
    return false;
  }, [projectId]);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval>;

    const run = async () => {
      const stopped = await poll();
      if (!stopped && active) {
        interval = setInterval(async () => {
          const done = await poll();
          if (done && interval) {
            clearInterval(interval);
          }
        }, 1500);
      }
    };

    run();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [poll]);

  const handleContinue = () => {
    onComplete({ id: projectId } as Project);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-50/95 backdrop-blur-xl" />

      {/* Card */}
      <motion.div
        className="relative glass-card p-8 max-w-md w-full mx-4"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-blue flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-dark-800">正在分析仓库</h3>
            {projectName && (
              <p className="text-sm text-dark-400 font-mono">{projectName}</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1 mb-8">
          <AnimatePresence>
            {steps.map((step, i) => (
              <motion.div
                key={step.key}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-200"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <StepIcon status={step.status} />
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    step.status === "active"
                      ? "text-dark-800"
                      : step.status === "done"
                        ? "text-dark-600"
                        : step.status === "error"
                          ? "text-red-400"
                          : "text-dark-400"
                  }`}
                >
                  {step.label}
                </span>
                {step.status === "done" && (
                  <motion.span
                    className="ml-auto text-xs text-emerald-400/60"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-accent-blue to-accent-cyan rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: isDone
                ? "100%"
                : `${Math.max(10, (steps.filter((s) => s.status === "done").length / Math.max(steps.length, 1)) * 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Footer */}
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.button
                onClick={handleContinue}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium flex items-center gap-2 mx-auto shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                查看分析结果
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.p
              key="loading"
              className="text-center text-sm text-dark-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              AI 正在分析代码结构，预计需要 30 秒...
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
