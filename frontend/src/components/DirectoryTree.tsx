import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder, File } from "lucide-react";

interface TreeNode {
  name: string;
  isDir: boolean;
  children: TreeNode[];
}

function parseTree(treeStr: string): TreeNode[] {
  const lines = treeStr.split("\n");
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const isDir = line.endsWith("/");
    const name = line.replace(/[│├└──\s]+/g, "").replace(/\/$/, "").trim();
    if (!name) continue;

    const depth = (line.match(/[│ ]/g)?.length ?? 0) / 4;
    const node: TreeNode = { name, isDir, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    if (isDir) {
      stack.push({ node, depth });
    }
  }

  return root;
}

function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  return (
    <div>
      <motion.div
        className="flex items-center gap-1 py-1 px-2 hover:bg-white/[0.04] rounded-lg cursor-pointer text-sm group transition-colors duration-200"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.isDir && setExpanded(!expanded)}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {node.isDir ? (
          <>
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-dark-400" />
            </motion.div>
            <Folder className="w-4 h-4 text-primary-400" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="w-4 h-4 text-dark-400 group-hover:text-dark-500 transition-colors" />
          </>
        )}
        <span className={node.isDir ? "font-medium text-dark-700" : "text-dark-500 group-hover:text-dark-600 transition-colors"}>
          {node.name}
        </span>
      </motion.div>
      <AnimatePresence>
        {node.isDir && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {node.children.map((child, i) => (
              <TreeNodeView key={`${child.name}-${i}`} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DirectoryTree({ tree }: { tree: string }) {
  const nodes = parseTree(tree);

  return (
    <motion.div
      className="font-mono text-sm bg-white/[0.02] rounded-xl p-4 overflow-auto max-h-[600px] border border-white/[0.04]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {nodes.map((node, i) => (
        <TreeNodeView key={`${node.name}-${i}`} node={node} />
      ))}
    </motion.div>
  );
}
