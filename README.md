# RepoMind

> 让 AI 在数十秒内理解任意 GitHub 仓库，帮助开发者快速上手复杂代码库。

RepoMind 是一个面向开发者的 AI 仓库理解与架构分析平台。输入一个 GitHub 仓库链接，即可自动获得项目结构分析、架构图、模块说明、技术栈识别，以及基于 RAG 的项目问答能力。

## 核心功能

- **仓库解析** — 自动克隆仓库、扫描文件、识别技术栈（React、FastAPI、SpringBoot 等）
- **AST 静态分析** — 基于 tree-sitter 的函数/类/import 关系分析
- **AI 架构分析** — LLM 驱动的项目概述、模块职责、架构模式识别（MVC、微服务、分层、DDD）
- **Mermaid 架构图** — 自动生成系统架构图、调用关系图、模块依赖图、数据流图
- **RepoChat 问答** — 基于 RAG 的项目级问答（如"认证逻辑在哪里？"）
- **自动 README 生成** — AI 自动生成项目文档
- **学习路径生成** — 为复杂项目推荐代码阅读顺序

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python · FastAPI · SQLAlchemy · PostgreSQL · pgvector |
| 前端 | React · TypeScript · TailwindCSS · Mermaid · Cytoscape.js |
| AI | DeepSeek API · BGE-M3 · RAG |
| 分析 | tree-sitter |

## 系统架构

```
React Web UI → FastAPI Backend
                   ├── AST 分析 (tree-sitter)
                   ├── RAG 检索 (pgvector + BGE-M3)
                   └── AI 推理 (DeepSeek API)
                           ↓
                      PostgreSQL
```

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+（需启用 pgvector 扩展）

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 配置数据库
cp .env.example .env
# 编辑 .env 填入数据库连接和 DeepSeek API Key

# 运行数据库迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 使用

1. 在页面输入 GitHub 仓库链接
2. 点击"分析"，等待 AI 完成解析
3. 查看项目结构、架构图、模块说明
4. 使用 RepoChat 向项目提问

## 项目结构

```
RepoMind/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 配置、依赖注入
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── services/       # 业务逻辑
│   │   │   ├── parser/     # 仓库解析
│   │   │   ├── analyzer/   # AST 分析
│   │   │   ├── ai/         # AI 推理
│   │   │   └── rag/        # RAG 检索
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   └── requirements.txt
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── services/       # API 调用
│   └── package.json
└── README.md
```

## 开发阶段

- [x] Phase 1: 基础仓库解析（文件扫描、技术栈识别、目录树）
- [ ] Phase 2: AST 静态分析（import/函数/类/调用关系）
- [ ] Phase 3: AI 集成（DeepSeek API、自动 README、架构分析）
- [ ] Phase 4: RepoChat（embedding、RAG、项目问答）
- [ ] Phase 5: 体验优化（UI、架构图、学习路径）

## License

MIT
