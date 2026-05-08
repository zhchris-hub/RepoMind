import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chat } from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({ projectId }: { projectId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const { answer } = await chat(projectId, question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，回答失败，请稍后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <h2 className="text-lg font-semibold mb-4 text-dark-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary-400" />
        RepoChat - 项目问答
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-blue/10 flex items-center justify-center border border-white/[0.06]">
                <Bot className="w-8 h-8 text-dark-400" />
              </div>
              <p className="text-dark-500 mb-3">向项目提问，例如：</p>
              <div className="space-y-2">
                {["认证逻辑在哪里？", "这个项目使用了什么架构模式？", "数据库是如何设计的？"].map((q, i) => (
                  <motion.p
                    key={q}
                    className="text-sm text-dark-400 glass inline-block px-3 py-1.5 rounded-lg mx-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    "{q}"
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-blue/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20"
                    : "glass text-dark-700 prose prose-sm max-w-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 border border-white/[0.06]">
                  <User className="w-4 h-4 text-dark-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-blue/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
              <Bot className="w-4 h-4 text-primary-400" />
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-dot" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-dot [animation-delay:0.16s]" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce-dot [animation-delay:0.32s]" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入关于项目的问题..."
          className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-sm text-dark-800 placeholder:text-dark-400 transition-all duration-300"
          disabled={loading}
        />
        <motion.button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
