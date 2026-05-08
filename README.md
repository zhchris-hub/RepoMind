<p align="center">
  <img src="assets/banner.svg" alt="RepoMind" width="100%">
</p>

<h3 align="center">Understand any GitHub repository in seconds.<br/>AI-powered architecture analysis, code understanding, and intelligent Q&A.</h3>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Python-3.11+-3776ab.svg?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61dafb.svg?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &nbsp;&bull;&nbsp;
  <a href="#features">Features</a> &nbsp;&bull;&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;&bull;&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;&bull;&nbsp;
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <a href="https://repomind.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-🚀-0ea5e9?style=for-the-badge" alt="Live Demo"></a>
</p>

---

> Paste a GitHub repo URL. Get architecture diagrams, module docs, and AI-powered Q&A in 30 seconds.

RepoMind transforms complex codebases into visual architecture, interactive knowledge, and AI-powered project understanding. No setup, no config — just paste a link and go.

<!-- PLACEHOLDER: Replace with actual GIF recording -->
<!-- Record: paste URL → analysis progress → architecture diagram → RepoChat Q&A -->
<p align="center">
  <em>Demo GIF coming soon — run locally to experience the full flow</em>
</p>

---

## Features

**Architecture Diagram Generation** — AI analyzes code structure and auto-generates Mermaid diagrams showing module relationships, dependencies, and call chains.

**Multi-Language AST Analysis** — tree-sitter powered static analysis for 9 languages: Python, JavaScript, TypeScript, Java, Go, Rust, Ruby, C, C++. Extracts functions, classes, imports, and dependency graphs.

**RAG-Powered Q&A** — Ask questions like "Where is the auth logic?" and get answers grounded in actual code via vector similarity search with pgvector.

**Smart Repo Scanning** — Auto-detects tech stack, generates directory trees, and identifies key project files. Supports shallow clones for fast analysis.

**Learning Path Generation** — Generates recommended reading order for complex projects, reducing onboarding time from days to hours.

**Knowledge Graph** — Interactive visualization of code dependencies and module relationships (Cytoscape.js).

---

## Architecture

```
                            ┌─────────────────────┐
                            │    React Frontend    │
                            │   Vite + TypeScript  │
                            │   Tailwind + Motion  │
                            └──────────┬──────────┘
                                       │ HTTP
                            ┌──────────▼──────────┐
                            │    FastAPI Backend   │
                            │   Async SQLAlchemy   │
                            │   Background Tasks   │
                            └──────────┬──────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   Repo Scanner    │   │   AST Analyzer    │   │   AI Pipeline     │
    │   git clone +     │   │   tree-sitter     │   │   DeepSeek API    │
    │   file scan +     │   │   9 languages     │   │   LLM + Embedding │
    │   tech detect     │   │   functions/classes│   │   RAG + Q&A       │
    └───────────────────┘   └───────────────────┘   └───────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │    PostgreSQL 16     │
                            │      pgvector        │
                            │   Vector(1024)       │
                            └─────────────────────┘
```

### Analysis Pipeline

```
POST /analyze
  │
  ├─ 1. Clone repo (shallow, depth=1)
  ├─ 2. Scan files, detect tech stack
  ├─ 3. Build directory tree
  ├─ 4. AST analysis (tree-sitter, 9 languages)
  ├─ 5. DeepSeek: generate overview
  ├─ 6. DeepSeek: generate Mermaid architecture diagram
  ├─ 7. DeepSeek: generate README summary
  ├─ 8. DeepSeek: generate learning path
  └─ 9. Index chunks for RAG (pgvector embeddings)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5.6, Vite 5, TailwindCSS 3.4, framer-motion, Mermaid, Cytoscape.js |
| Backend | FastAPI 0.115, SQLAlchemy 2.0 (async), tree-sitter (9 languages), httpx |
| Database | PostgreSQL 16, pgvector (vector similarity search) |
| AI | DeepSeek API (chat + embeddings), RAG pipeline with 1500-char chunking |
| Infra | Docker Compose, nginx (production frontend) |

---

## Quick Start

### Docker Compose (Recommended)

```bash
git clone https://github.com/your-username/RepoMind.git
cd RepoMind

cp backend/.env.example backend/.env
# Edit .env → add your DEEPSEEK_API_KEY

docker compose up
```

Open http://localhost:5173

### Manual Setup

**Prerequisites:** Python 3.11+, Node.js 18+, PostgreSQL 16 with pgvector

```bash
# Database
docker compose up -d db

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in DATABASE_URL and DEEPSEEK_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### How to Use

1. Paste a GitHub repo URL on the home page
2. Wait ~30 seconds for AI analysis to complete
3. Explore: Overview → Directory Tree → AST Analysis → Architecture Diagram → README → Chat
4. Ask questions in RepoChat: "Where is the entry point?" / "Explain the database layer"

---

## Supported Languages (AST Analysis)

| Language | Imports | Functions | Classes/Structs |
|----------|---------|-----------|-----------------|
| Python | `import`, `from ... import` | `def` | `class` |
| JavaScript/TypeScript | `import` | `function`, `method` | `class` |
| Java | `import` | `method` | `class`, `interface` |
| Go | `import` | `func` | — |
| Rust | `use` | `fn` | `struct`, `enum`, `trait`, `impl` |
| Ruby | `require`, `require_relative` | `def` | `class`, `module` |
| C | `#include` | function definitions | `struct`, `typedef` |
| C++ | `#include` | function definitions | `class`, `struct` (with inheritance) |

---

## Screenshots

<!-- PLACEHOLDER: Add actual screenshots -->
<p align="center">
  <em>Screenshots coming soon — home page, architecture diagram, AST analysis, RepoChat</em>
</p>

| Home | Architecture Diagram |
|------|---------------------|
| ![Home](screenshots/home.png) | ![Architecture](screenshots/architecture.png) |

| AST Analysis | RepoChat |
|-------------|----------|
| ![AST](screenshots/ast.png) | ![Chat](screenshots/chat.png) |

---

## Project Structure

```
RepoMind/
├── backend/
│   └── app/
│       ├── api/routes.py           # 6 API endpoints under /api
│       ├── core/                    # Config (pydantic-settings) + async DB
│       ├── models/project.py        # ORM: Project, File, Chunk (pgvector)
│       └── services/
│           ├── parser/              # Git clone, file scan, tech stack detection
│           ├── analyzer/            # tree-sitter AST (9 languages)
│           ├── ai/                  # DeepSeek LLM pipeline (4 analysis stages)
│           └── rag/                 # Embedding, chunking, vector search, Q&A
├── frontend/
│   └── src/
│       ├── pages/                   # Home (hero + input) + ProjectDetail (6 tabs)
│       ├── components/              # AnalysisOverlay, ChatPanel, MermaidDiagram,
│       │                            # DirectoryTree, KnowledgeGraph
│       └── services/api.ts          # Fetch-based API client
├── docker-compose.yml               # 3 services: db, backend, frontend
└── 《RepoMind AI 仓库理解平台》.md   # Full product spec (Chinese)
```

---

## Roadmap

- [x] **v0.1** — Repo parsing: clone, file scan, tech stack, directory tree
- [x] **v0.2** — AST analysis: tree-sitter multi-language extraction (9 languages)
- [x] **v0.3** — AI integration: DeepSeek API, architecture diagrams, README generation
- [x] **v0.4** — RepoChat: embedding, RAG-powered Q&A
- [ ] **v0.5** — Interactive knowledge graph (Cytoscape.js), learning path improvements
- [ ] **v0.6** — Multi-repo comparison, dependency impact analysis
- [ ] **v0.7** — Plugin system for custom analyzers
- [ ] **v1.0** — Production-ready: auth, rate limiting, CI/CD, performance optimization

---

## Contributing

Contributions are welcome! Please read the following before submitting:

1. Fork the repo and create a feature branch
2. Follow existing code style (Python: type hints, async/await; TypeScript: strict mode)
3. Test your changes locally with `docker compose up`
4. Submit a PR with a clear description of what and why

For major changes, open an issue first to discuss the approach.

---

## License

[MIT](LICENSE)
