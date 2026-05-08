import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Brain } from "lucide-react";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-black/[0.06]" style={{ boxShadow: "0 1px 30px rgba(0, 0, 0, 0.04)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center glow-blue transition-shadow duration-300">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-dark-800">
                RepoMind
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-sm text-dark-500 font-medium">AI 仓库理解平台</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Route Transitions */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
