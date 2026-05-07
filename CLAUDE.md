# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RepoMind is an AI-powered repository understanding and architecture analysis platform. Its goal: "Let AI understand any GitHub project in tens of seconds, and help developers quickly onboard complex codebases."

The project is currently in the design/spec phase. The full specification is in `《RepoMind AI 仓库理解平台》.md`.

## Planned Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, pgvector, tree-sitter
**Frontend:** React, TypeScript, TailwindCSS, Mermaid (diagrams), Cytoscape.js (knowledge graph visualization)
**AI:** DeepSeek API (LLM inference), BGE-M3 (embeddings), RAG pipeline, LangChain (later phase)

## Architecture

```
React Web UI → FastAPI Backend → [AST Analysis (tree-sitter) | RAG Retrieval (pgvector) | AI Inference (DeepSeek API)] → PostgreSQL
```

Core modules (to be implemented):
- **Repo Parser** — clone repos, scan files, identify tech stacks via manifest files
- **AST Analyzer** — function/class/import analysis via tree-sitter
- **AI Architect** — LLM-based project overview, module responsibilities, architecture pattern detection
- **Diagram Generator** — auto-generate Mermaid architecture, call, dependency, and data flow diagrams
- **RepoChat** — RAG-based Q&A over the codebase
- **Auto README** — AI-generated project documentation
- **Learning Path** — suggested reading order for complex projects

## Database Schema (3 tables)

- `projects` — id, name, repo_url, created_at
- `files` — id, project_id, path, language, content
- `chunks` — id, file_id, embedding (vector), content

## Development Phases

1. **Phase 1 (Weeks 1-2):** Repo parsing — GitHub clone, file scanning, tech stack ID, directory tree, JSON output, basic web page
2. **Phase 2 (Weeks 3-4):** AST analysis — import relations, function/class/call analysis
3. **Phase 3 (Weeks 5-6):** AI integration — DeepSeek API, auto README, module descriptions, architecture analysis
4. **Phase 4 (Weeks 7-8):** RepoChat — embedding, RAG, project Q&A
5. **Phase 5 (Weeks 9-10):** UX polish — UI, diagrams, learning paths

## Language Priority for AST Support

Start with Python, JavaScript, TypeScript. Expand to other languages later.

## Key Design Decisions

- AST pre-filtering before LLM calls to manage token costs
- Chunk-based analysis with incremental indexing for large repos
- Multi-language support via tree-sitter grammar ecosystem
- Architecture pattern detection: MVC, microservices, layered, DDD
