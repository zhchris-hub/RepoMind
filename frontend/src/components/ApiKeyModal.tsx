import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Eye, EyeOff, ExternalLink, X } from "lucide-react";
import { getApiKey, setApiKey, clearApiKey } from "../services/api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getApiKey();
      setKey(existing || "");
      setSaved(false);
      setShowKey(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setSaved(true);
      setTimeout(() => onClose(), 800);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setKey("");
    setSaved(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative glass-card p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-dark-400 hover:text-dark-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-800">设置 API Key</h2>
                <p className="text-xs text-dark-400">需要 DeepSeek API Key 来分析新项目</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-600 mb-1.5">
                  DeepSeek API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="sk-..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white/60 border border-black/[0.06] rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 outline-none text-dark-800 placeholder:text-dark-400 text-sm font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <a
                href="https://platform.deepseek.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                前往 DeepSeek 获取 API Key
              </a>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!key.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
                >
                  {saved ? "已保存" : "保存"}
                </button>
                {getApiKey() && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2.5 bg-dark-100 text-dark-600 rounded-xl hover:bg-dark-200 font-medium text-sm transition-all"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
