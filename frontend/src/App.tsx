import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen relative">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-orb-cyan" />
      </div>

      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-blue rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow duration-300">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <div className="absolute inset-0 w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-blue rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-300 via-primary-400 to-accent-blue bg-clip-text text-transparent">
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
