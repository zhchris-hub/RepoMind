import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";

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
      <div
        className="flex items-center gap-1 py-0.5 px-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.isDir && setExpanded(!expanded)}
      >
        {node.isDir ? (
          <>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <Folder className="w-4 h-4 text-blue-500" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="w-4 h-4 text-gray-400" />
          </>
        )}
        <span className={node.isDir ? "font-medium text-gray-800" : "text-gray-600"}>
          {node.name}
        </span>
      </div>
      {node.isDir && expanded && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeView key={`${child.name}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DirectoryTree({ tree }: { tree: string }) {
  const nodes = parseTree(tree);

  return (
    <div className="font-mono text-sm bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
      {nodes.map((node, i) => (
        <TreeNodeView key={`${node.name}-${i}`} node={node} />
      ))}
    </div>
  );
}
